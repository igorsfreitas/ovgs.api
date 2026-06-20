import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { ScheduleDto } from './dto/schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SchedulingStatus } from './enums/scheduling-status.enum';
import { SalesOrdersService } from './sales-orders.service';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
    private readonly salesOrders: SalesOrdersService,
  ) {}

  /** Define (cria ou substitui) o agendamento; volta ao estado PENDING. */
  async define(orderId: string, dto: ScheduleDto): Promise<Schedule> {
    await this.salesOrders.findOne(orderId);
    this.assertValidWindow(dto);

    const existing = await this.repo.findOne({
      where: { salesOrder: { id: orderId } },
    });
    const schedule =
      existing ??
      this.repo.create({ salesOrder: { id: orderId } as SalesOrder });

    schedule.deliveryDate = dto.deliveryDate.slice(0, 10);
    schedule.windowStart = dto.windowStart;
    schedule.windowEnd = dto.windowEnd;
    schedule.status = SchedulingStatus.Pending;
    return this.repo.save(schedule);
  }

  /** Confirma o agendamento existente (pré-requisito para a OV ir a AGENDADA). */
  async confirm(orderId: string): Promise<Schedule> {
    const schedule = await this.findByOrder(orderId);
    schedule.status = SchedulingStatus.Confirmed;
    return this.repo.save(schedule);
  }

  /** Reagenda um agendamento existente, voltando ao estado PENDING. */
  async reschedule(orderId: string, dto: ScheduleDto): Promise<Schedule> {
    const schedule = await this.findByOrder(orderId);
    this.assertValidWindow(dto);
    schedule.deliveryDate = dto.deliveryDate.slice(0, 10);
    schedule.windowStart = dto.windowStart;
    schedule.windowEnd = dto.windowEnd;
    schedule.status = SchedulingStatus.Pending;
    return this.repo.save(schedule);
  }

  async findByOrder(orderId: string): Promise<Schedule> {
    const schedule = await this.repo.findOne({
      where: { salesOrder: { id: orderId } },
    });
    if (!schedule) {
      throw new NotFoundException(
        `No schedule found for sales order ${orderId}`,
      );
    }
    return schedule;
  }

  private assertValidWindow(dto: ScheduleDto): void {
    if (dto.windowStart >= dto.windowEnd) {
      throw new BusinessRuleException(
        'windowEnd must be later than windowStart',
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (dto.deliveryDate.slice(0, 10) < today) {
      throw new BusinessRuleException('deliveryDate cannot be in the past');
    }
  }
}
