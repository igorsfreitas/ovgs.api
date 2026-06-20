import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { AUDIT_EVENT, type AuditEventPayload } from './audit.types';
import { AuditEvent } from './entities/audit-event.entity';

/**
 * Consome os eventos de domínio e persiste a trilha de auditoria, desacoplando
 * as regras de negócio da gravação de auditoria (arquitetura orientada a eventos).
 */
@Injectable()
export class AuditListener {
  constructor(private readonly audit: AuditService) {}

  @OnEvent(AUDIT_EVENT, { async: true })
  handle(payload: AuditEventPayload): Promise<AuditEvent> {
    return this.audit.record(payload);
  }
}
