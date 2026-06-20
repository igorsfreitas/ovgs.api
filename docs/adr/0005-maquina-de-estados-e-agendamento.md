# ADR 0005 — Máquina de estados da OV + agendamento no agregado

**Status:** Aceita

## Contexto

A Ordem de Venda tem um fluxo operacional estritamente sequencial
(`CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE`), e a transição para
`AGENDADA` depende de um agendamento confirmado. Era preciso evitar transições
inválidas e dependência circular entre OV e agendamento.

## Decisão

- Modelar as transições em uma **máquina de estados pura** (`sales-order-state-machine.ts`):
  um mapa de transições válidas + `canTransition()`, sem dependências — 100%
  testável. Transições inválidas levantam `InvalidStatusTransitionException` (409).
- Tratar o **agendamento como parte do agregado da OV** (mesmo módulo), em vez de
  um módulo separado. Assim a invariante "AGENDADA exige agendamento confirmado"
  fica coesa, e o `SalesOrdersService` consulta o repositório de `Schedule`
  diretamente, **sem dependência circular** entre módulos.

## Consequências

- (+) Lógica de transição isolada, determinística e trivial de testar.
- (+) Sem ciclo de dependências; a regra de pré-requisito vive junto do agregado.
- (+) Fácil estender o fluxo (ex.: cancelamento/revogação) alterando só o mapa.
- (−) Um módulo `scheduling` dedicado traria mais isolamento, ao custo de
  `forwardRef`/eventos para resolver o ciclo — não justificado neste escopo.
- Disponibilidade de agendamento é **simplificada** (coerência de janela + data
  não-passada), conforme permitido pelo desafio.
