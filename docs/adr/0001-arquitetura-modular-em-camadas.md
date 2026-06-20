# ADR 0001 — Arquitetura NestJS modular em camadas

**Status:** Aceita

## Contexto

O desafio pede separação clara de responsabilidades (controllers, services,
repositories, DTOs, validação, tratamento de exceções) e penaliza acoplamento.
O domínio é de porte médio (cadastros + ciclo de vida da OV + agendamento +
auditoria), com equipe pequena.

## Decisão

Adotar **NestJS modular em camadas**: um módulo por contexto
(`auth`, `transport-types`, `customers`, `items`, `sales-orders`, `audit`,
`health`), cada um com `Controller` (HTTP/validação) → `Service` (regra de
negócio) → `Repository` (TypeORM). DTOs validam a entrada; um filtro global
padroniza erros; cross-cutting concerns (validation pipe, logging, exception
filter) ficam em `common/`.

Optou-se por **layered pragmático** em vez de Clean Architecture completa
(use-cases, ports/adapters, entidades de domínio puras).

## Consequências

- (+) Idiomático ao NestJS, baixo boilerplate, fácil de navegar e testar.
- (+) Fronteiras de módulo explícitas permitem extrair serviços no futuro.
- (−) As entidades de domínio são acopladas ao ORM (decorators TypeORM); uma
  camada de domínio pura exigiria mapeamento adicional.
- Mitigação: a lógica de negócio vive nos services (testável isoladamente com
  repositórios mockados), não nos controllers nem nas entidades.
