import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { Item } from '../items/entities/item.entity';
import { ItemsService } from '../items/items.service';
import { TransportType } from '../transport-types/entities/transport-type.entity';
import { TransportTypesService } from '../transport-types/transport-types.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception';
import { canTransition } from './sales-order-state-machine';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly repo: Repository<SalesOrder>,
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

  findAll(): Promise<SalesOrder[]> {
    return this.repo.find({
      relations: { customer: true, transportType: true },
      order: { createdAt: 'DESC' },
    });
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
    order.status = target;
    await this.repo.save(order);
    return this.findOne(id);
  }
}
