import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TransportType } from '../transport-types/entities/transport-type.entity';
import { TransportTypesService } from '../transport-types/transport-types.service';
import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const transportTypes = { findByIds: jest.fn() };
  let service: CustomersService;

  const baseCustomer = (): Customer => ({
    id: 'c1',
    name: 'ACME',
    document: '12345678000199',
    email: null,
    isActive: true,
    authorizedTransportTypes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CustomersService(
      repo as unknown as Repository<Customer>,
      transportTypes as unknown as TransportTypesService,
    );
  });

  describe('create', () => {
    it('creates without authorized transports', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<Customer>) => d);
      repo.save.mockImplementation((d: Partial<Customer>) => ({
        id: 'c1',
        ...d,
      }));

      await service.create({ name: 'ACME', document: '12345678000199' });

      expect(transportTypes.findByIds).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith({
        name: 'ACME',
        document: '12345678000199',
        email: null,
        authorizedTransportTypes: [],
      });
    });

    it('resolves authorized transports when ids are provided', async () => {
      repo.findOne.mockResolvedValue(null);
      transportTypes.findByIds.mockResolvedValue([
        { id: 't1' } as TransportType,
      ]);
      repo.create.mockImplementation((d: Partial<Customer>) => d);
      repo.save.mockImplementation((d: Partial<Customer>) => d);

      await service.create({
        name: 'ACME',
        document: '12345678000199',
        authorizedTransportTypeIds: ['t1'],
      });

      expect(transportTypes.findByIds).toHaveBeenCalledWith(['t1']);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorizedTransportTypes: [{ id: 't1' }] }),
      );
    });

    it('rejects a duplicated document', async () => {
      repo.findOne.mockResolvedValue(baseCustomer());
      await expect(
        service.create({ name: 'X', document: '12345678000199' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('loads the customer with authorized transports', async () => {
      const customer = baseCustomer();
      repo.findOne.mockResolvedValue(customer);
      await expect(service.findOne('c1')).resolves.toBe(customer);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'c1' },
        relations: { authorizedTransportTypes: true },
      });
    });

    it('throws when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates simple fields', async () => {
      repo.findOne.mockResolvedValueOnce(baseCustomer());
      repo.save.mockImplementation((d: Customer) => d);
      const result = await service.update('c1', { name: 'New name' });
      expect(result.name).toBe('New name');
    });

    it('checks document availability when it changes', async () => {
      repo.findOne
        .mockResolvedValueOnce(baseCustomer())
        .mockResolvedValueOnce(null);
      repo.save.mockImplementation((d: Customer) => d);
      await service.update('c1', { document: '99999999000100' });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { document: '99999999000100' },
      });
    });

    it('rejects when the new document already exists', async () => {
      repo.findOne
        .mockResolvedValueOnce(baseCustomer())
        .mockResolvedValueOnce({ id: 'c2' });
      await expect(
        service.update('c1', { document: '99999999000100' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('setAuthorizedTransports', () => {
    it('replaces the authorized list', async () => {
      repo.findOne.mockResolvedValue(baseCustomer());
      transportTypes.findByIds.mockResolvedValue([
        { id: 't1' },
        { id: 't2' },
      ] as TransportType[]);
      repo.save.mockImplementation((d: Customer) => d);

      const result = await service.setAuthorizedTransports('c1', ['t1', 't2']);

      expect(transportTypes.findByIds).toHaveBeenCalledWith(['t1', 't2']);
      expect(result.authorizedTransportTypes).toHaveLength(2);
    });

    it('clears the list when no ids are given', async () => {
      repo.findOne.mockResolvedValue(baseCustomer());
      repo.save.mockImplementation((d: Customer) => d);

      const result = await service.setAuthorizedTransports('c1', []);

      expect(transportTypes.findByIds).not.toHaveBeenCalled();
      expect(result.authorizedTransportTypes).toEqual([]);
    });
  });

  describe('isTransportAuthorized', () => {
    it('returns true when the transport is authorized', async () => {
      repo.findOne.mockResolvedValue({
        ...baseCustomer(),
        authorizedTransportTypes: [{ id: 't1' } as TransportType],
      });
      await expect(service.isTransportAuthorized('c1', 't1')).resolves.toBe(
        true,
      );
    });

    it('returns false otherwise', async () => {
      repo.findOne.mockResolvedValue(baseCustomer());
      await expect(service.isTransportAuthorized('c1', 't9')).resolves.toBe(
        false,
      );
    });
  });

  describe('findAll', () => {
    it('lists ordered by name', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    });
  });
});
