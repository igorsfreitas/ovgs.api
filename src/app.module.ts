import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { CustomersModule } from './customers/customers.module';
import {
  EnvironmentVariables,
  NodeEnv,
  validateEnv,
} from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TransportTypesModule } from './transport-types/transport-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const nodeEnv = config.get('NODE_ENV', { infer: true });
        const isDev = nodeEnv === NodeEnv.Development;
        const level =
          nodeEnv === NodeEnv.Test ? 'silent' : isDev ? 'debug' : 'info';
        return {
          pinoHttp: {
            level,
            genReqId: (req, res) => {
              const header = req.headers['x-correlation-id'];
              const id =
                (Array.isArray(header) ? header[0] : header) ?? randomUUID();
              res.setHeader('x-correlation-id', id);
              return id;
            },
            redact: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
            ],
            transport: isDev
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          },
        };
      },
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    TransportTypesModule,
    CustomersModule,
    HealthModule,
  ],
})
export class AppModule {}
