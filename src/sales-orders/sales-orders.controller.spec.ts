import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };
  let controller: SalesOrdersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SalesOrdersController(
      service as unknown as SalesOrdersService,
    );
  });

  it('delegates create', async () => {
    const dto = {
      customerId: 'c1',
      transportTypeId: 't1',
      items: [{ itemId: 'i1', quantity: 1 }],
    };
    service.create.mockResolvedValue({ id: 'so1' });
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findAll', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'so1' });
    await controller.findOne('so1');
    expect(service.findOne).toHaveBeenCalledWith('so1');
  });

  it('delegates updateStatus', async () => {
    service.updateStatus.mockResolvedValue({ id: 'so1' });
    await controller.updateStatus('so1', {
      status: SalesOrderStatus.Planejada,
    });
    expect(service.updateStatus).toHaveBeenCalledWith(
      'so1',
      SalesOrderStatus.Planejada,
    );
  });
});
