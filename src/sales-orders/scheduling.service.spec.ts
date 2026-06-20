import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { ScheduleDto } from './dto/schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { SchedulingStatus } from './enums/scheduling-status.enum';
import { SalesOrdersService } from './sales-orders.service';
import { SchedulingService } from './scheduling.service';

describe('SchedulingService', () => {
  const repo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const salesOrders = { findOne: jest.fn() };
  const events = { emitAsync: jest.fn() };
  let service: SchedulingService;

  const futureDate = '2999-01-01';
  const validDto: ScheduleDto = {
    deliveryDate: futureDate,
    windowStart: '08:00',
    windowEnd: '12:00',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SchedulingService(
      repo as unknown as Repository<Schedule>,
      salesOrders as unknown as SalesOrdersService,
      events as unknown as EventEmitter2,
    );
  });

  describe('define', () => {
    it('creates a new schedule in PENDING when none exists', async () => {
      salesOrders.findOne.mockResolvedValue({ id: 'so1' });
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<Schedule>) => d);
      repo.save.mockImplementation((d: Partial<Schedule>) => d);

      const result = await service.define('so1', validDto);

      expect(result.status).toBe(SchedulingStatus.Pending);
      expect(result.deliveryDate).toBe(futureDate);
    });

    it('replaces an existing schedule and resets it to PENDING', async () => {
      salesOrders.findOne.mockResolvedValue({ id: 'so1' });
      repo.findOne.mockResolvedValue({
        id: 's1',
        status: SchedulingStatus.Confirmed,
      });
      repo.save.mockImplementation((d: Partial<Schedule>) => d);

      const result = await service.define('so1', validDto);

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.status).toBe(SchedulingStatus.Pending);
    });

    it('rejects a window where end is not after start', async () => {
      salesOrders.findOne.mockResolvedValue({ id: 'so1' });
      await expect(
        service.define('so1', {
          ...validDto,
          windowStart: '12:00',
          windowEnd: '08:00',
        }),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('rejects a delivery date in the past', async () => {
      salesOrders.findOne.mockResolvedValue({ id: 'so1' });
      await expect(
        service.define('so1', { ...validDto, deliveryDate: '2000-01-01' }),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });
  });

  describe('confirm', () => {
    it('confirms an existing schedule', async () => {
      repo.findOne.mockResolvedValue({
        id: 's1',
        status: SchedulingStatus.Pending,
      });
      repo.save.mockImplementation((d: Partial<Schedule>) => d);

      const result = await service.confirm('so1');

      expect(result.status).toBe(SchedulingStatus.Confirmed);
    });

    it('throws when there is no schedule', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.confirm('so1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reschedule', () => {
    it('updates an existing schedule and resets it to PENDING', async () => {
      repo.findOne.mockResolvedValue({
        id: 's1',
        status: SchedulingStatus.Confirmed,
      });
      repo.save.mockImplementation((d: Partial<Schedule>) => d);

      const result = await service.reschedule('so1', validDto);

      expect(result.status).toBe(SchedulingStatus.Pending);
      expect(result.windowStart).toBe('08:00');
    });

    it('throws when there is no schedule', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.reschedule('so1', validDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByOrder', () => {
    it('returns the schedule when present', async () => {
      const schedule = { id: 's1' };
      repo.findOne.mockResolvedValue(schedule);
      await expect(service.findByOrder('so1')).resolves.toBe(schedule);
    });

    it('throws when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByOrder('so1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
