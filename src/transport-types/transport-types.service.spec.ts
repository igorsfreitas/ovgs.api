import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TransportType } from './entities/transport-type.entity';
import { TransportTypesService } from './transport-types.service';

describe('TransportTypesService', () => {
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: TransportTypesService;

  const entity: TransportType = {
    id: 't1',
    name: 'Caminhão',
    code: 'TRUCK',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TransportTypesService(
      repo as unknown as Repository<TransportType>,
    );
  });

  describe('create', () => {
    it('creates when the code is available', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<TransportType>) => d);
      repo.save.mockImplementation((d: Partial<TransportType>) => ({
        id: 't1',
        ...d,
      }));

      const result = await service.create({ name: 'Caminhão', code: 'TRUCK' });

      expect(repo.create).toHaveBeenCalledWith({
        name: 'Caminhão',
        code: 'TRUCK',
        description: null,
      });
      expect(result).toHaveProperty('id', 't1');
    });

    it('keeps the provided description', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<TransportType>) => d);
      repo.save.mockImplementation((d: Partial<TransportType>) => d);

      await service.create({
        name: 'Carreta',
        code: 'CARRETA',
        description: 'desc',
      });

      expect(repo.create).toHaveBeenCalledWith({
        name: 'Carreta',
        code: 'CARRETA',
        description: 'desc',
      });
    });

    it('rejects a duplicated code', async () => {
      repo.findOne.mockResolvedValue(entity);
      await expect(
        service.create({ name: 'x', code: 'TRUCK' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('lists all by default', async () => {
      repo.find.mockResolvedValue([entity]);
      await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { name: 'ASC' },
      });
    });

    it('filters active only', async () => {
      repo.find.mockResolvedValue([entity]);
      await service.findAll(true);
      expect(repo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the entity when found', async () => {
      repo.findOne.mockResolvedValue(entity);
      await expect(service.findOne('t1')).resolves.toBe(entity);
    });

    it('throws when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByIds', () => {
    it('returns all when every id exists', async () => {
      repo.find.mockResolvedValue([entity]);
      await expect(service.findByIds(['t1'])).resolves.toEqual([entity]);
    });

    it('throws when some id is missing', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.findByIds(['t1', 't2'])).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates fields without changing the code', async () => {
      repo.findOne.mockResolvedValueOnce({ ...entity });
      repo.save.mockImplementation((d: TransportType) => d);
      const result = await service.update('t1', { name: 'Novo' });
      expect(result.name).toBe('Novo');
    });

    it('checks availability when the code changes', async () => {
      repo.findOne
        .mockResolvedValueOnce({ ...entity })
        .mockResolvedValueOnce(null);
      repo.save.mockImplementation((d: TransportType) => d);
      await service.update('t1', { code: 'CARRETA' });
      expect(repo.findOne).toHaveBeenCalledWith({ where: { code: 'CARRETA' } });
    });

    it('rejects when the new code already exists', async () => {
      repo.findOne
        .mockResolvedValueOnce({ ...entity })
        .mockResolvedValueOnce({ id: 't2', code: 'CARRETA' });
      await expect(
        service.update('t1', { code: 'CARRETA' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the entity is missing', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.update('x', { name: 'y' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
