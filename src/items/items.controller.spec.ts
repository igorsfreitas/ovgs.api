import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

describe('ItemsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  let controller: ItemsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ItemsController(service as unknown as ItemsService);
  });

  it('delegates create', async () => {
    service.create.mockResolvedValue({ id: 'i1' });
    await controller.create({ sku: 'SKU1', name: 'Box' });
    expect(service.create).toHaveBeenCalledWith({ sku: 'SKU1', name: 'Box' });
  });

  it('delegates findAll', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'i1' });
    await controller.findOne('i1');
    expect(service.findOne).toHaveBeenCalledWith('i1');
  });
});
