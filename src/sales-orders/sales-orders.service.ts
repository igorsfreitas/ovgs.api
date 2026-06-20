import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { AUDIT_EVENT, AuditAction } from '../audit/audit.types';
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
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreateSalesOrderDto, actor?: string): Promise<SalesOrder> {
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

    await this.events.emitAsync(AUDIT_EVENT, {
      action: AuditAction.SalesOrderCreated,
      entityName: 'SalesOrder',
      entityId: saved.id,
      newState: {
        status: SalesOrderStatus.Criada,
        customerId: dto.customerId,
        transportTypeId: dto.transportTypeId,
        items: dto.items,
      },
      actor,
    });

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
    actor?: string,
  ): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (!canTransition(order.status, target)) {
      throw new InvalidStatusTransitionException(order.status, target);
    }
    if (target === SalesOrderStatus.Agendada) {
      await this.assertConfirmedSchedule(id);
    }
    const previous = order.status;
    order.status = target;
    await this.repo.save(order);

    await this.events.emitAsync(AUDIT_EVENT, {
      action: AuditAction.SalesOrderStatusChanged,
      entityName: 'SalesOrder',
      entityId: id,
      previousState: { status: previous },
      newState: { status: target },
      actor,
    });

    return this.findOne(id);
  }

  /** Troca o tipo de transporte da OV (revalidando a autorização do cliente). */
  async changeTransport(
    id: string,
    transportTypeId: string,
    actor?: string,
  ): Promise<SalesOrder> {
    const order = await this.findOne(id);
    await this.transportTypes.findOne(transportTypeId);

    const authorized = await this.customers.isTransportAuthorized(
      order.customer.id,
      transportTypeId,
    );
    if (!authorized) {
      throw new BusinessRuleException(
        `Transport type ${transportTypeId} is not authorized for customer ${order.customer.id}`,
      );
    }

    const previous = order.transportType.id;
    order.transportType = { id: transportTypeId } as TransportType;
    await this.repo.save(order);

    await this.events.emitAsync(AUDIT_EVENT, {
      action: AuditAction.SalesOrderTransportChanged,
      entityName: 'SalesOrder',
      entityId: id,
      previousState: { transportTypeId: previous },
      newState: { transportTypeId },
      actor,
    });

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
