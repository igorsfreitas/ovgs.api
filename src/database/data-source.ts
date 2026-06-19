import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm-options';

/**
 * DataSource usado pelo CLI do TypeORM (geração e execução de migrations).
 * É executado via ts-node (`tsconfig.cli.json`), onde o glob de entidades `.ts`
 * funciona. No runtime da aplicação usamos `autoLoadEntities` (ver DatabaseModule).
 */
const dataSource = new DataSource({
  ...buildDataSourceOptions({
    DATABASE_HOST: process.env.DATABASE_HOST ?? 'localhost',
    DATABASE_PORT: Number(process.env.DATABASE_PORT ?? 5432),
    DATABASE_USER: process.env.DATABASE_USER ?? 'ovgs',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? 'ovgs',
    DATABASE_NAME: process.env.DATABASE_NAME ?? 'ovgs',
  }),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
});

export default dataSource;
