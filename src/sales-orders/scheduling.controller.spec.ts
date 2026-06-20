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

  it('delegates define', async () => {
    service.define.mockResolvedValue({ id: 's1' });
    await controller.define('so1', dto);
    expect(service.define).toHaveBeenCalledWith('so1', dto);
  });

  it('delegates confirm', async () => {
    service.confirm.mockResolvedValue({ id: 's1' });
    await controller.confirm('so1');
    expect(service.confirm).toHaveBeenCalledWith('so1');
  });

  it('delegates reschedule', async () => {
    service.reschedule.mockResolvedValue({ id: 's1' });
    await controller.reschedule('so1', dto);
    expect(service.reschedule).toHaveBeenCalledWith('so1', dto);
  });
});
