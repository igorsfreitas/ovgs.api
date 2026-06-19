import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

export interface DatabaseEnv {
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
}

/**
 * Opções de conexão compartilhadas entre o runtime (TypeOrmModule.forRootAsync)
 * e o CLI de migrations (data-source.ts).
 *
 * `synchronize` é sempre `false`: o schema evolui exclusivamente via migrations
 * versionadas, garantindo previsibilidade e auditabilidade das mudanças de banco.
 */
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    synchronize: false,
    migrationsTableName: 'migrations_history',
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}
