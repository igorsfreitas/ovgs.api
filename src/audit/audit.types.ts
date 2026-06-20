/** Nome do evento de domínio consumido pelo `AuditListener`. */
export const AUDIT_EVENT = 'audit.record';

export enum AuditAction {
  SalesOrderCreated = 'SALES_ORDER_CREATED',
  SalesOrderStatusChanged = 'SALES_ORDER_STATUS_CHANGED',
  ScheduleChanged = 'SCHEDULE_CHANGED',
  SalesOrderTransportChanged = 'SALES_ORDER_TRANSPORT_CHANGED',
}

export interface AuditEventPayload {
  action: AuditAction;
  entityName: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  actor?: string | null;
}
