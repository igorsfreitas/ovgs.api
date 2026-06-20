import { buildDataSourceOptions, DatabaseEnv } from './typeorm-options';

describe('buildDataSourceOptions', () => {
  const env: DatabaseEnv = {
    DATABASE_HOST: 'db-host',
    DATABASE_PORT: 6543,
    DATABASE_USER: 'user',
    DATABASE_PASSWORD: 'secret',
    DATABASE_NAME: 'ovgs',
  };

  it('builds postgres options from the provided environment', () => {
    const options = buildDataSourceOptions(env);

    expect(options.type).toBe('postgres');
    expect(options).toMatchObject({
      host: 'db-host',
      port: 6543,
      username: 'user',
      password: 'secret',
      database: 'ovgs',
    });
  });

  it('never enables synchronize and uses a dedicated migrations table', () => {
    const options = buildDataSourceOptions(env);

    expect(options.synchronize).toBe(false);
    expect(options.migrationsTableName).toBe('migrations_history');
  });
});
