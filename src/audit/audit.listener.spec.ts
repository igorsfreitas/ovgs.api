import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';
import { AuditAction } from './audit.types';

describe('AuditListener', () => {
  it('delegates the domain event to the audit service', async () => {
    const audit = { record: jest.fn().mockResolvedValue({ id: 'a1' }) };
    const listener = new AuditListener(audit as unknown as AuditService);
    const payload = {
      action: AuditAction.SalesOrderCreated,
      entityName: 'SalesOrder',
      entityId: 'so1',
    };

    await listener.handle(payload);

    expect(audit.record).toHaveBeenCalledWith(payload);
  });
});
