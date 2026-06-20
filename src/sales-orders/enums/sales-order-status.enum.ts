/** Estados do fluxo operacional de uma Ordem de Venda. */
export enum SalesOrderStatus {
  Criada = 'CRIADA',
  Planejada = 'PLANEJADA',
  Agendada = 'AGENDADA',
  EmTransporte = 'EM_TRANSPORTE',
  Entregue = 'ENTREGUE',
}
