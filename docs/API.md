# Referência da API — OVGS

Documentação de todos os endpoints. Versão interativa (executável) em **`/docs`**
(Swagger) e coleção pronta em **[`postman/`](../postman)**.

**Convenções**

- Base URL padrão: `http://localhost:3000`.
- Autenticação: `Authorization: Bearer <access_token>` (obtido em `POST /auth/login`),
  exceto endpoints marcados como **Público**.
- Papéis: **ADMIN** (catálogo/config e auditoria) e **OPERATOR** (operação).
- Erros padronizados: `{ statusCode, error, message, timestamp, path }`.

**Códigos de status comuns**

| Código | Significado |
|---|---|
| 400 | Validação de payload/param falhou |
| 401 | Sem token / token inválido |
| 403 | Papel insuficiente (RBAC) |
| 404 | Recurso não encontrado |
| 409 | Conflito (unicidade ou transição de status inválida) |
| 422 | Violação de regra de negócio |

---

## Auth

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Público | Autentica e retorna o JWT |
| GET | `/auth/me` | Autenticado | Dados do usuário do token |

```jsonc
// POST /auth/login
{ "email": "admin@ovgs.local", "password": "admin12345" }
// 200 → { "access_token": "..." }   | 401 credenciais inválidas
```

## Health

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | Público | Liveness + ping no banco (`@nestjs/terminus`) |

## Transport Types

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| POST | `/transport-types` | ADMIN | 201 / 400 / 403 / 409 |
| GET | `/transport-types?activeOnly=bool` | Autenticado | 200 |
| GET | `/transport-types/:id` | Autenticado | 200 / 400 / 404 |
| PATCH | `/transport-types/:id` | ADMIN | 200 / 404 / 409 |

```jsonc
// POST /transport-types
{ "name": "Caminhão", "code": "TRUCK", "description": "opcional" }
// code: CAIXA ALTA [A-Z0-9_], único (409 se duplicado)
```

## Customers

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| POST | `/customers` | Autenticado | 201 / 400 / 409 |
| GET | `/customers` | Autenticado | 200 |
| GET | `/customers/:id` | Autenticado | 200 / 404 (inclui `authorizedTransportTypes`) |
| PATCH | `/customers/:id` | Autenticado | 200 / 404 / 409 |
| PUT | `/customers/:id/transport-types` | Autenticado | 200 / 404 |

```jsonc
// POST /customers
{ "name": "ACME Ltda", "document": "12345678000199", "email": "x@y.com",
  "authorizedTransportTypeIds": ["<uuid>"] }
// document: 11–18 chars, único (409). PUT .../transport-types substitui a lista.
```

## Items

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| POST | `/items` | ADMIN | 201 / 400 / 403 / 409 |
| GET | `/items` | Autenticado | 200 |
| GET | `/items/:id` | Autenticado | 200 / 404 |

```jsonc
// POST /items
{ "sku": "SKU-1", "name": "Caixa", "unit": "CX", "description": "opcional" }
// sku único (409 se duplicado)
```

## Sales Orders

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| POST | `/sales-orders` | Autenticado | 201 / 400 / 404 / 422 |
| GET | `/sales-orders` | Autenticado | 200 (paginado) |
| GET | `/sales-orders/:id` | Autenticado | 200 / 404 |
| PATCH | `/sales-orders/:id/status` | Autenticado | 200 / 404 / 409 / 422 |
| PATCH | `/sales-orders/:id/transport-type` | Autenticado | 200 / 404 / 422 |

**Criação** — valida: cliente e transporte existem; **transporte autorizado para o
cliente** (422 se não); **≥ 1 item** (400) e todos existentes (404). Nasce em `CRIADA`.

```jsonc
// POST /sales-orders
{ "customerId": "<uuid>", "transportTypeId": "<uuid>",
  "items": [{ "itemId": "<uuid>", "quantity": 2 }] }
```

**Monitoramento** — `GET /sales-orders` aceita filtros e paginação:

| Query | Tipo |
|---|---|
| `status` | enum (`CRIADA`…`ENTREGUE`) |
| `customerId` / `transportTypeId` | uuid |
| `dateFrom` / `dateTo` | data (YYYY-MM-DD) sobre `createdAt` |
| `page` / `limit` | inteiro (default 1 / 20) |

Resposta: `{ data: [...], total, page, limit }`.

**Status** — transições válidas (senão 409); `AGENDADA` exige agendamento confirmado (senão 422):

```
CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE
```

```jsonc
// PATCH /sales-orders/:id/status
{ "status": "PLANEJADA" }
// PATCH /sales-orders/:id/transport-type   (revalida autorização)
{ "transportTypeId": "<uuid>" }
```

## Scheduling (Central de Agendamento)

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| GET | `/sales-orders/:id/schedule` | Autenticado | 200 / 404 |
| PUT | `/sales-orders/:id/schedule` | Autenticado | 200 (PENDING) / 422 / 404 |
| POST | `/sales-orders/:id/schedule/confirm` | Autenticado | 200 (CONFIRMED) / 404 |
| POST | `/sales-orders/:id/schedule/reschedule` | Autenticado | 200 (PENDING) / 422 / 404 |

```jsonc
// PUT / POST .../reschedule
{ "deliveryDate": "2030-01-01", "windowStart": "08:00", "windowEnd": "12:00" }
// 422 se windowEnd <= windowStart ou data no passado
```

## Audit

| Método | Rota | Acesso | Respostas |
|---|---|---|---|
| GET | `/audit?entityId&action&page&limit` | ADMIN | 200 / 403 |

Cada evento: `{ action, entityName, entityId, previousState, newState, actor, occurredAt }`.
Ações: `SALES_ORDER_CREATED`, `SALES_ORDER_STATUS_CHANGED`, `SCHEDULE_CHANGED`,
`SALES_ORDER_TRANSPORT_CHANGED`.

## OpenAPI / Swagger

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/docs` | Público | Swagger UI (com *Authorize* Bearer) |
| GET | `/docs-json` | Público | Documento OpenAPI (JSON) |
