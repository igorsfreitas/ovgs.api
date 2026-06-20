import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { allowedTransitions, canTransition } from './sales-order-state-machine';

describe('sales order state machine', () => {
  it('allows each sequential forward transition', () => {
    expect(
      canTransition(SalesOrderStatus.Criada, SalesOrderStatus.Planejada),
    ).toBe(true);
    expect(
      canTransition(SalesOrderStatus.Planejada, SalesOrderStatus.Agendada),
    ).toBe(true);
    expect(
      canTransition(SalesOrderStatus.Agendada, SalesOrderStatus.EmTransporte),
    ).toBe(true);
    expect(
      canTransition(SalesOrderStatus.EmTransporte, SalesOrderStatus.Entregue),
    ).toBe(true);
  });

  it('rejects skipping states', () => {
    expect(
      canTransition(SalesOrderStatus.Criada, SalesOrderStatus.Agendada),
    ).toBe(false);
    expect(
      canTransition(SalesOrderStatus.Criada, SalesOrderStatus.Entregue),
    ).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(
      canTransition(SalesOrderStatus.Agendada, SalesOrderStatus.Criada),
    ).toBe(false);
  });

  it('treats ENTREGUE as a terminal state', () => {
    expect(allowedTransitions(SalesOrderStatus.Entregue)).toEqual([]);
    expect(
      canTransition(SalesOrderStatus.Entregue, SalesOrderStatus.Criada),
    ).toBe(false);
  });
});
