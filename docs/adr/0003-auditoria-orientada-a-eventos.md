# ADR 0003 — Auditoria orientada a eventos de domínio

**Status:** Aceita

## Contexto

A solução deve registrar eventos relevantes (criação de OV, mudança de status,
de agendamento e de transporte) com **ator, ação, entidade e estado anterior/
posterior**. A gravação de auditoria não deve poluir nem acoplar a regra de
negócio.

## Decisão

Aplicar uma **arquitetura orientada a eventos (EDA leve)** com
`@nestjs/event-emitter`: os services emitem um evento de domínio
(`AUDIT_EVENT`) com o payload de auditoria; um `AuditListener` consome e persiste
em uma tabela **append-only** (`audit_events`), que referencia a entidade por
`entityId`/`entityName` (sem FK) e guarda estados em `jsonb`. Leitura em
`GET /audit` restrita a `ADMIN`.

A emissão usa `emitAsync` (aguardada dentro da requisição) para **garantir a
durabilidade** da auditoria.

## Consequências

- (+) Regra de negócio desacoplada da gravação de auditoria; fácil adicionar
  novos consumidores (ex.: SIEM, métricas) sem tocar nos services.
- (+) Trilha imutável e independente do ciclo de vida das demais tabelas.
- (−) `emitAsync` acopla a latência da requisição à gravação da auditoria.
- Evolução: em alto volume, migrar para **outbox + worker** (consumo assíncrono
  real) preservando a mesma interface de eventos.
