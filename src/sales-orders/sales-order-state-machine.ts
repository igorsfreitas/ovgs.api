import { SalesOrderStatus } from './enums/sales-order-status.enum';

/**
 * Transições válidas do fluxo operacional. O fluxo é estritamente sequencial:
 * CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE.
 * Qualquer transição fora dessa sequência é rejeitada.
 */
export const SALES_ORDER_TRANSITIONS: Record<
  SalesOrderStatus,
  readonly SalesOrderStatus[]
> = {
  [SalesOrderStatus.Criada]: [SalesOrderStatus.Planejada],
  [SalesOrderStatus.Planejada]: [SalesOrderStatus.Agendada],
  [SalesOrderStatus.Agendada]: [SalesOrderStatus.EmTransporte],
  [SalesOrderStatus.EmTransporte]: [SalesOrderStatus.Entregue],
  [SalesOrderStatus.Entregue]: [],
};

export function allowedTransitions(
  from: SalesOrderStatus,
): readonly SalesOrderStatus[] {
  return SALES_ORDER_TRANSITIONS[from];
}

export function canTransition(
  from: SalesOrderStatus,
  to: SalesOrderStatus,
): boolean {
  return SALES_ORDER_TRANSITIONS[from].includes(to);
}
