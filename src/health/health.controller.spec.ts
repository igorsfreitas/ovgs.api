import { Test } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheckService = { check: jest.fn() };
  const dbIndicator = { pingCheck: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: dbIndicator },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('delegates to the health check service with a database ping', async () => {
    const expected = { status: 'ok' };
    healthCheckService.check.mockImplementation(
      (indicators: Array<() => unknown>) => {
        indicators.forEach((fn) => fn());
        return expected;
      },
    );

    const result = await controller.check();

    expect(result).toBe(expected);
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database');
  });
});
