import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ScheduleDto } from './dto/schedule.dto';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

describe('SchedulingController', () => {
  const service = {
    findByOrder: jest.fn(),
    define: jest.fn(),
    confirm: jest.fn(),
    reschedule: jest.fn(),
  };
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'admin@ovgs',
    role: 'ADMIN',
  };
  let controller: SchedulingController;

  const dto: ScheduleDto = {
    deliveryDate: '2999-01-01',
    windowStart: '08:00',
    windowEnd: '12:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SchedulingController(
      service as unknown as SchedulingService,
    );
  });

  it('delegates get', async () => {
    service.findByOrder.mockResolvedValue({ id: 's1' });
    await controller.get('so1');
    expect(service.findByOrder).toHaveBeenCalledWith('so1');
  });

  it('delegates define with the actor', async () => {
    service.define.mockResolvedValue({ id: 's1' });
    await controller.define('so1', dto, user);
    expect(service.define).toHaveBeenCalledWith('so1', dto, 'admin@ovgs');
  });

  it('delegates confirm with the actor', async () => {
    service.confirm.mockResolvedValue({ id: 's1' });
    await controller.confirm('so1', user);
    expect(service.confirm).toHaveBeenCalledWith('so1', 'admin@ovgs');
  });

  it('delegates reschedule with the actor', async () => {
    service.reschedule.mockResolvedValue({ id: 's1' });
    await controller.reschedule('so1', dto, user);
    expect(service.reschedule).toHaveBeenCalledWith('so1', dto, 'admin@ovgs');
  });
});
