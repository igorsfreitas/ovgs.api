import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  it('delegates findAll to the audit service', async () => {
    const service = {
      findAll: jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      }),
    };
    const controller = new AuditController(service as unknown as AuditService);
    const query = { page: 1, limit: 20 };

    await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });
});
