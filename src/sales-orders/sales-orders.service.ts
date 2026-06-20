import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { Item } from '../items/entities/item.entity';
import { ItemsService } from '../items/items.service';
import { TransportType } from '../transport-types/entities/transport-type.entity';
import { TransportTypesService } from '../transport-types/transport-types.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { QuerySalesOrdersDto } from './dto/query-sales-orders.dto';
import { Schedule } from './entities/schedule.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { SchedulingStatus } from './enums/scheduling-status.enum';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception';
import { canTransition } from './sales-order-state-machine';

export interface PaginatedSalesOrders {
  data: SalesOrder[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly repo: Repository<SalesOrder>,
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    private readonly customers: CustomersService,
    private readonly transportTypes: TransportTypesService,
    private readonly items: ItemsService,
  ) {}

  async create(dto: CreateSalesOrderDto): Promise<SalesOrder> {
    // 1. Cliente e tipo de transporte devem existir.
    await this.customers.findOne(dto.customerId);
    await this.transportTypes.findOne(dto.transportTypeId);

    // 2. Regra central: o transporte precisa estar autorizado para o cliente.
    const authorized = await this.customers.isTransportAuthorized(
      dto.customerId,
      dto.transportTypeId,
    );
    if (!authorized) {
      throw new BusinessRuleException(
        `Transport type ${dto.transportTypeId} is not authorized for customer ${dto.customerId}`,
      );
    }

    // 3. Todos os itens devem existir previamente (premissa do desafio).
    await this.items.findByIds(dto.items.map((line) => line.itemId));

    // 4. Persiste a OV no estado inicial CRIADA, com seus itens.
    const order = this.repo.create({
      customer: { id: dto.customerId } as Customer,
      transportType: { id: dto.transportTypeId } as TransportType,
      status: SalesOrderStatus.Criada,
      items: dto.items.map(
        (line) =>
          ({
            item: { id: line.itemId } as Item,
            quantity: line.quantity,
          }) as SalesOrderItem,
      ),
    });
    const saved = await this.repo.save(order);
    return this.findOne(saved.id);
  }

  /** Monitoramento operacional: filtros por status, cliente, transporte e data, paginado. */
  async findAll(query: QuerySalesOrdersDto): Promise<PaginatedSalesOrders> {
    const { page, limit } = query;
    const where: FindOptionsWhere<SalesOrder> = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.customerId) {
      where.customer = { id: query.customerId };
    }
    if (query.transportTypeId) {
      where.transportType = { id: query.transportTypeId };
    }

    const from = query.dateFrom
      ? new Date(`${query.dateFrom.slice(0, 10)}T00:00:00.000Z`)
      : undefined;
    const to = query.dateTo
      ? new Date(`${query.dateTo.slice(0, 10)}T23:59:59.999Z`)
      : undefined;
    if (from && to) {
      where.createdAt = Between(from, to);
    } else if (from) {
      where.createdAt = MoreThanOrEqual(from);
    } else if (to) {
      where.createdAt = LessThanOrEqual(to);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { customer: true, transportType: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<SalesOrder> {
    const found = await this.repo.findOne({
      where: { id },
      relations: { customer: true, transportType: true, items: true },
    });
    if (!found) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }
    return found;
  }

  /** Atualiza o status respeitando a máquina de estados (transições válidas). */
  async updateStatus(
    id: string,
    target: SalesOrderStatus,
  ): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (!canTransition(order.status, target)) {
      throw new InvalidStatusTransitionException(order.status, target);
    }
    if (target === SalesOrderStatus.Agendada) {
      await this.assertConfirmedSchedule(id);
    }
    order.status = target;
    await this.repo.save(order);
    return this.findOne(id);
  }

  /** Garante que a OV possui um agendamento confirmado antes de ir a AGENDADA. */
  private async assertConfirmedSchedule(orderId: string): Promise<void> {
    const schedule = await this.schedules.findOne({
      where: { salesOrder: { id: orderId } },
    });
    if (!schedule || schedule.status !== SchedulingStatus.Confirmed) {
      throw new BusinessRuleException(
        'Sales order requires a confirmed schedule before moving to AGENDADA',
      );
    }
  }
}
