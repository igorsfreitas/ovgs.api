import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';

describe('ItemsService', () => {
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: ItemsService;

  const item: Item = {
    id: 'i1',
    sku: 'SKU1',
    name: 'Box',
    unit: 'UN',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ItemsService(repo as unknown as Repository<Item>);
  });

  describe('create', () => {
    it('creates with the default unit', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<Item>) => d);
      repo.save.mockImplementation((d: Partial<Item>) => ({ id: 'i1', ...d }));

      await service.create({ sku: 'SKU1', name: 'Box' });

      expect(repo.create).toHaveBeenCalledWith({
        sku: 'SKU1',
        name: 'Box',
        unit: 'UN',
        description: null,
      });
    });

    it('keeps a provided unit and description', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((d: Partial<Item>) => d);
      repo.save.mockImplementation((d: Partial<Item>) => d);

      await service.create({
        sku: 'SKU2',
        name: 'Bag',
        unit: 'KG',
        description: 'heavy',
      });

      expect(repo.create).toHaveBeenCalledWith({
        sku: 'SKU2',
        name: 'Bag',
        unit: 'KG',
        description: 'heavy',
      });
    });

    it('rejects a duplicated SKU', async () => {
      repo.findOne.mockResolvedValue(item);
      await expect(
        service.create({ sku: 'SKU1', name: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns the item when found', async () => {
      repo.findOne.mockResolvedValue(item);
      await expect(service.findOne('i1')).resolves.toBe(item);
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
      repo.find.mockResolvedValue([item]);
      await expect(service.findByIds(['i1'])).resolves.toEqual([item]);
    });

    it('throws when some id is missing', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.findByIds(['i1', 'i2'])).rejects.toBeInstanceOf(
        NotFoundException,
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
