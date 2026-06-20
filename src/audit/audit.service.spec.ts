import { Repository } from 'typeorm';
import { AuditAction } from './audit.types';
import { AuditService } from './audit.service';
import { AuditEvent } from './entities/audit-event.entity';

describe('AuditService', () => {
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };
  let service: AuditService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuditService(repo as unknown as Repository<AuditEvent>);
  });

  describe('record', () => {
    it('persists an event defaulting optional fields to null', async () => {
      repo.create.mockImplementation((d: Partial<AuditEvent>) => d);
      repo.save.mockImplementation((d: Partial<AuditEvent>) => d);

      await service.record({
        action: AuditAction.SalesOrderCreated,
        entityName: 'SalesOrder',
        entityId: 'so1',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SalesOrderCreated,
          previousState: null,
          newState: null,
          actor: null,
        }),
      );
    });

    it('keeps the provided state and actor', async () => {
      repo.create.mockImplementation((d: Partial<AuditEvent>) => d);
      repo.save.mockImplementation((d: Partial<AuditEvent>) => d);

      await service.record({
        action: AuditAction.SalesOrderStatusChanged,
        entityName: 'SalesOrder',
        entityId: 'so1',
        previousState: { status: 'CRIADA' },
        newState: { status: 'PLANEJADA' },
        actor: 'admin@ovgs',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: 'admin@ovgs',
          previousState: { status: 'CRIADA' },
          newState: { status: 'PLANEJADA' },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('filters by entityId and action with pagination', async () => {
      repo.findAndCount.mockResolvedValue([[{ id: 'a1' }], 1]);

      const result = await service.findAll({
        entityId: 'so1',
        action: AuditAction.SalesOrderCreated,
        page: 2,
        limit: 5,
      });

      expect(result).toEqual({
        data: [{ id: 'a1' }],
        total: 1,
        page: 2,
        limit: 5,
      });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('works with no filters', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });
});
