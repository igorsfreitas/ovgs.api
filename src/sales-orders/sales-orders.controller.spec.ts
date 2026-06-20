import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SalesOrderStatus } from './enums/sales-order-status.enum';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    changeTransport: jest.fn(),
  };
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'admin@ovgs',
    role: 'ADMIN',
  };
  let controller: SalesOrdersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SalesOrdersController(
      service as unknown as SalesOrdersService,
    );
  });

  it('delegates create with the actor', async () => {
    const dto = {
      customerId: 'c1',
      transportTypeId: 't1',
      items: [{ itemId: 'i1', quantity: 1 }],
    };
    service.create.mockResolvedValue({ id: 'so1' });
    await controller.create(dto, user);
    expect(service.create).toHaveBeenCalledWith(dto, 'admin@ovgs');
  });

  it('delegates findAll with the query', async () => {
    const query = { page: 1, limit: 20 };
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'so1' });
    await controller.findOne('so1');
    expect(service.findOne).toHaveBeenCalledWith('so1');
  });

  it('delegates updateStatus with the actor', async () => {
    service.updateStatus.mockResolvedValue({ id: 'so1' });
    await controller.updateStatus(
      'so1',
      { status: SalesOrderStatus.Planejada },
      user,
    );
    expect(service.updateStatus).toHaveBeenCalledWith(
      'so1',
      SalesOrderStatus.Planejada,
      'admin@ovgs',
    );
  });

  it('delegates changeTransport with the actor', async () => {
    service.changeTransport.mockResolvedValue({ id: 'so1' });
    await controller.changeTransport('so1', { transportTypeId: 't2' }, user);
    expect(service.changeTransport).toHaveBeenCalledWith(
      'so1',
      't2',
      'admin@ovgs',
    );
  });
});
