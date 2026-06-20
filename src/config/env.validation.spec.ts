import { NodeEnv, validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validRaw = {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_HOST: 'db',
    DATABASE_PORT: '5433',
    DATABASE_USER: 'u',
    DATABASE_PASSWORD: 'p',
    DATABASE_NAME: 'n',
  };

  it('accepts a valid environment and coerces numeric strings', () => {
    const env = validateEnv(validRaw);

    expect(env.NODE_ENV).toBe(NodeEnv.Test);
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_PORT).toBe(5433);
  });

  it('applies defaults when optional vars are missing', () => {
    const env = validateEnv({});

    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_HOST).toBe('localhost');
  });

  it('throws on an out-of-range port', () => {
    expect(() => validateEnv({ ...validRaw, PORT: '70000' })).toThrow(
      /Invalid environment variables/,
    );
  });

  it('throws on an invalid NODE_ENV', () => {
    expect(() => validateEnv({ ...validRaw, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });
});
