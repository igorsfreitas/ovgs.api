import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUDIT_EVENT, AuditAction } from '../audit/audit.types';
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
    private readonly events: EventEmitter2,
  ) {}

  /** Define (cria ou substitui) o agendamento; volta ao estado PENDING. */
  async define(
    orderId: string,
    dto: ScheduleDto,
    actor?: string,
  ): Promise<Schedule> {
    await this.salesOrders.findOne(orderId);
    this.assertValidWindow(dto);

    const existing = await this.repo.findOne({
      where: { salesOrder: { id: orderId } },
    });
    const previous = existing ? this.snapshot(existing) : null;
    const schedule =
      existing ??
      this.repo.create({ salesOrder: { id: orderId } as SalesOrder });

    schedule.deliveryDate = dto.deliveryDate.slice(0, 10);
    schedule.windowStart = dto.windowStart;
    schedule.windowEnd = dto.windowEnd;
    schedule.status = SchedulingStatus.Pending;
    return this.saveAndAudit(orderId, schedule, previous, actor);
  }

  /** Confirma o agendamento existente (pré-requisito para a OV ir a AGENDADA). */
  async confirm(orderId: string, actor?: string): Promise<Schedule> {
    const schedule = await this.findByOrder(orderId);
    const previous = this.snapshot(schedule);
    schedule.status = SchedulingStatus.Confirmed;
    return this.saveAndAudit(orderId, schedule, previous, actor);
  }

  /** Reagenda um agendamento existente, voltando ao estado PENDING. */
  async reschedule(
    orderId: string,
    dto: ScheduleDto,
    actor?: string,
  ): Promise<Schedule> {
    const schedule = await this.findByOrder(orderId);
    this.assertValidWindow(dto);
    const previous = this.snapshot(schedule);
    schedule.deliveryDate = dto.deliveryDate.slice(0, 10);
    schedule.windowStart = dto.windowStart;
    schedule.windowEnd = dto.windowEnd;
    schedule.status = SchedulingStatus.Pending;
    return this.saveAndAudit(orderId, schedule, previous, actor);
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

  private async saveAndAudit(
    orderId: string,
    schedule: Schedule,
    previous: Record<string, unknown> | null,
    actor?: string,
  ): Promise<Schedule> {
    const saved = await this.repo.save(schedule);
    await this.events.emitAsync(AUDIT_EVENT, {
      action: AuditAction.ScheduleChanged,
      entityName: 'Schedule',
      entityId: orderId,
      previousState: previous,
      newState: this.snapshot(saved),
      actor,
    });
    return saved;
  }

  private snapshot(schedule: Schedule): Record<string, unknown> {
    return {
      deliveryDate: schedule.deliveryDate,
      windowStart: schedule.windowStart,
      windowEnd: schedule.windowEnd,
      status: schedule.status,
    };
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
