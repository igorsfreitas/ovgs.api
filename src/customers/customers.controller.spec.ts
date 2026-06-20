import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

describe('CustomersController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setAuthorizedTransports: jest.fn(),
  };
  let controller: CustomersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CustomersController(
      service as unknown as CustomersService,
    );
  });

  it('delegates create', async () => {
    service.create.mockResolvedValue({ id: 'c1' });
    await controller.create({ name: 'ACME', document: '12345678000199' });
    expect(service.create).toHaveBeenCalledWith({
      name: 'ACME',
      document: '12345678000199',
    });
  });

  it('delegates findAll', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'c1' });
    await controller.findOne('c1');
    expect(service.findOne).toHaveBeenCalledWith('c1');
  });

  it('delegates update', async () => {
    service.update.mockResolvedValue({ id: 'c1' });
    await controller.update('c1', { name: 'New' });
    expect(service.update).toHaveBeenCalledWith('c1', { name: 'New' });
  });

  it('delegates setAuthorizedTransports', async () => {
    service.setAuthorizedTransports.mockResolvedValue({ id: 'c1' });
    await controller.setAuthorizedTransports('c1', {
      transportTypeIds: ['t1'],
    });
    expect(service.setAuthorizedTransports).toHaveBeenCalledWith('c1', ['t1']);
  });
});
