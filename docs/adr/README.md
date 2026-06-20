# Architecture Decision Records (ADR)

Registro das principais decisões arquiteturais do OVGS API. Cada ADR segue o
formato: **Contexto → Decisão → Consequências** (com prós e contras).

| # | Decisão | Status |
|---|---------|--------|
| [0001](0001-arquitetura-modular-em-camadas.md) | Arquitetura NestJS modular em camadas | Aceita |
| [0002](0002-persistencia-typeorm-migrations.md) | TypeORM + PostgreSQL com migrations (sem `synchronize`) | Aceita |
| [0003](0003-auditoria-orientada-a-eventos.md) | Auditoria orientada a eventos de domínio | Aceita |
| [0004](0004-autenticacao-jwt-rbac.md) | Autenticação JWT com guards globais e RBAC | Aceita |
| [0005](0005-maquina-de-estados-e-agendamento.md) | Máquina de estados da OV + agendamento no agregado | Aceita |
