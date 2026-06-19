import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Schema das variáveis de ambiente. Os valores padrão servem ao ambiente de
 * desenvolvimento local (e aos testes), mas devem ser sobrescritos via `.env`
 * / Docker Compose em qualquer ambiente real.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT = 3000;

  @IsString()
  DATABASE_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  DATABASE_PORT = 5432;

  @IsString()
  DATABASE_USER = 'ovgs';

  @IsString()
  DATABASE_PASSWORD = 'ovgs';

  @IsString()
  DATABASE_NAME = 'ovgs';
}

/** Função de validação consumida por `ConfigModule.forRoot({ validate })`. */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment variables:\n${errors
        .map(
          (e) =>
            `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
        )
        .join('\n')}`,
    );
  }

  return validated;
}
