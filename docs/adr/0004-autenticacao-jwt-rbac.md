# ADR 0004 — Autenticação JWT com guards globais e RBAC

**Status:** Aceita

## Contexto

A API expõe operações sensíveis (cadastros, mudança de status, auditoria) e
precisa de autenticação e autorização. Segurança e segregação de funções são
diferenciais avaliados.

## Decisão

Usar **JWT** (`@nestjs/jwt` + `passport-jwt`). Dois guards **globais**
registrados via `APP_GUARD`:

1. `JwtAuthGuard` — autentica todas as rotas por padrão; rotas marcadas com
   `@Public()` (login, health, docs) são liberadas.
2. `RolesGuard` — autoriza por papel via `@Roles(...)` (RBAC com `ADMIN` e
   `OPERATOR`).

Convenção de papéis: **dados de catálogo/configuração** (tipos de transporte,
itens, leitura de auditoria) exigem `ADMIN`; **dados operacionais** (clientes,
ordens de venda, agendamento) ficam disponíveis a qualquer usuário autenticado.
Senhas com `bcryptjs`; segredo do JWT validado no boot.

## Consequências

- (+) **Seguro por padrão**: tudo exige auth, salvo o explicitamente público.
- (+) RBAC declarativo e testável (guards unitários + e2e de 401/403).
- (−) `JWT_SECRET` tem default de desenvolvimento para rodar out-of-the-box —
  **deve** ser sobrescrito em produção (documentado no README e no `.env.example`).
- (−) Sem refresh token / rotação (fora do escopo do desafio).
