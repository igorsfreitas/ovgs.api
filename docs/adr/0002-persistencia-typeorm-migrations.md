# ADR 0002 — TypeORM + PostgreSQL com migrations (sem `synchronize`)

**Status:** Aceita

## Contexto

A solução exige um banco relacional e rastreabilidade das mudanças. É preciso
um caminho previsível para evoluir o schema entre ambientes (dev, CI, produção)
sem perda de dados.

## Decisão

Usar **PostgreSQL** com **TypeORM**, mantendo `synchronize: false` **sempre**.
O schema evolui apenas por **migrations versionadas** (tabela
`migrations_history`), geradas a partir das entidades (`migration:generate`) e
aplicadas explicitamente (`migration:run`).

Detalhes:

- IDs `uuid` (`uuid-ossp`); estados de auditoria em `jsonb`.
- O CLI de migrations roda sob `nodenext` via um `tsconfig.cli.json` que força
  `module: commonjs` (compatibilidade do `typeorm-ts-node-commonjs`).
- No runtime/testes as entidades são carregadas por `autoLoadEntities` (evita
  globs de entidade que não resolvem corretamente sob `ts-jest`); o `DataSource`
  do CLI usa glob, pois roda sob `ts-node`.

## Consequências

- (+) Mudanças de schema explícitas, revisáveis e reversíveis; seguras em produção.
- (+) Sem surpresas de `synchronize` apagando/alterando colunas.
- (−) Exige disciplina: toda mudança de entidade precisa de uma migration.
- (−) Dualidade de configuração (runtime vs CLI) por causa do `nodenext`.
