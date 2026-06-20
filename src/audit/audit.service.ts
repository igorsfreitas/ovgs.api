import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuditEventPayload } from './audit.types';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditEvent } from './entities/audit-event.entity';

export interface PaginatedAuditEvents {
  data: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly repo: Repository<AuditEvent>,
  ) {}

  /** Persiste um evento de auditoria (append-only). */
  record(payload: AuditEventPayload): Promise<AuditEvent> {
    const event = this.repo.create({
      action: payload.action,
      entityName: payload.entityName,
      entityId: payload.entityId,
      previousState: payload.previousState ?? null,
      newState: payload.newState ?? null,
      actor: payload.actor ?? null,
    });
    return this.repo.save(event);
  }

  async findAll(query: QueryAuditDto): Promise<PaginatedAuditEvents> {
    const { page, limit } = query;
    const where: FindOptionsWhere<AuditEvent> = {};
    if (query.entityId) {
      where.entityId = query.entityId;
    }
    if (query.action) {
      where.action = query.action;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { occurredAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
