import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { CustomersService } from '../customers/customers.service';
import { ItemsService } from '../items/items.service';
import { TransportTypesService } from '../transport-types/transport-types.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { Schedule } from './entities/schedule.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { SchedulingStatus } from './enums/scheduling-status.enum';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const schedules = { findOne: jest.fn() };
  const customers = { findOne: jest.fn(), isTransportAuthorized: jest.fn() };
  const transportTypes = { findOne: jest.fn() };
  const items = { findByIds: jest.fn() };
  let service: SalesOrdersService;

  const dto: CreateSalesOrderDto = {
    customerId: 'c1',
    transportTypeId: 't1',
    items: [{ itemId: 'i1', quantity: 2 }],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SalesOrdersService(
      repo as unknown as Repository<SalesOrder>,
      schedules as unknown as Repository<Schedule>,
      customers as unknown as CustomersService,
      transportTypes as unknown as TransportTypesService,
      items as unknown as ItemsService,
    );
  });

  describe('create', () => {
    it('creates an order when all rules pass', async () => {
      customers.findOne.mockResolvedValue({ id: 'c1' });
      transportTypes.findOne.mockResolvedValue({ id: 't1' });
      customers.isTransportAuthorized.mockResolvedValue(true);
      items.findByIds.mockResolvedValue([{ id: 'i1' }]);
      repo.create.mockReturnValue({ status: 'CRIADA' });
      repo.save.mockResolvedValue({ id: 'so1' });
      repo.findOne.mockResolvedValue({ id: 'so1', status: 'CRIADA' });

      const result = await service.create(dto);

      expect(customers.isTransportAuthorized).toHaveBeenCalledWith('c1', 't1');
      expect(items.findByIds).toHaveBeenCalledWith(['i1']);
      expect(result).toEqual({ id: 'so1', status: 'CRIADA' });
    });

    it('rejects when the transport is not authorized for the customer', async () => {
      customers.findOne.mockResolvedValue({ id: 'c1' });
      transportTypes.findOne.mockResolvedValue({ id: 't1' });
      customers.isTransportAuthorized.mockResolvedValue(false);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BusinessRuleException,
      );
      expect(items.findByIds).not.toHaveBeenCalled();
    });

    it('propagates when the customer does not exist', async () => {
      customers.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propagates when an item does not exist', async () => {
      customers.findOne.mockResolvedValue({ id: 'c1' });
      transportTypes.findOne.mockResolvedValue({ id: 't1' });
      customers.isTransportAuthorized.mockResolvedValue(true);
      items.findByIds.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns the order when found', async () => {
      const order = { id: 'so1' } as SalesOrder;
      repo.findOne.mockResolvedValue(order);
      await expect(service.findOne('so1')).resolves.toBe(order);
    });

    it('throws when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('lists with customer and transport relations', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({
        relations: { customer: true, transportType: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateStatus', () => {
    it('advances to the next valid state', async () => {
      repo.findOne
        .mockResolvedValueOnce({ id: 'so1', status: SalesOrderStatus.Criada })
        .mockResolvedValueOnce({
          id: 'so1',
          status: SalesOrderStatus.Planejada,
        });
      repo.save.mockResolvedValue({});

      const result = await service.updateStatus(
        'so1',
        SalesOrderStatus.Planejada,
      );

      expect(repo.save).toHaveBeenCalled();
      expect(result.status).toBe(SalesOrderStatus.Planejada);
    });

    it('rejects an invalid (out-of-sequence) transition', async () => {
      repo.findOne.mockResolvedValue({
        id: 'so1',
        status: SalesOrderStatus.Criada,
      });

      await expect(
        service.updateStatus('so1', SalesOrderStatus.Entregue),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws when the order does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('x', SalesOrderStatus.Planejada),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blocks AGENDADA without a schedule', async () => {
      repo.findOne.mockResolvedValue({
        id: 'so1',
        status: SalesOrderStatus.Planejada,
      });
      schedules.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('so1', SalesOrderStatus.Agendada),
      ).rejects.toBeInstanceOf(BusinessRuleException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('blocks AGENDADA when the schedule is not confirmed', async () => {
      repo.findOne.mockResolvedValue({
        id: 'so1',
        status: SalesOrderStatus.Planejada,
      });
      schedules.findOne.mockResolvedValue({
        status: SchedulingStatus.Pending,
      });

      await expect(
        service.updateStatus('so1', SalesOrderStatus.Agendada),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('allows AGENDADA when a confirmed schedule exists', async () => {
      repo.findOne
        .mockResolvedValueOnce({
          id: 'so1',
          status: SalesOrderStatus.Planejada,
        })
        .mockResolvedValueOnce({
          id: 'so1',
          status: SalesOrderStatus.Agendada,
        });
      schedules.findOne.mockResolvedValue({
        status: SchedulingStatus.Confirmed,
      });
      repo.save.mockResolvedValue({});

      const result = await service.updateStatus(
        'so1',
        SalesOrderStatus.Agendada,
      );
      expect(result.status).toBe(SalesOrderStatus.Agendada);
    });
  });
});
