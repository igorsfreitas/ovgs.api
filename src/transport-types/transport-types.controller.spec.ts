import { TransportTypesController } from './transport-types.controller';
import { TransportTypesService } from './transport-types.service';

describe('TransportTypesController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  let controller: TransportTypesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TransportTypesController(
      service as unknown as TransportTypesService,
    );
  });

  it('delegates create', async () => {
    service.create.mockResolvedValue({ id: 't1' });
    await controller.create({ name: 'Caminhão', code: 'TRUCK' });
    expect(service.create).toHaveBeenCalledWith({
      name: 'Caminhão',
      code: 'TRUCK',
    });
  });

  it('lists all by default when activeOnly is omitted', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(undefined);
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('lists active only when requested', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(true);
    expect(service.findAll).toHaveBeenCalledWith(true);
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue({ id: 't1' });
    await controller.findOne('t1');
    expect(service.findOne).toHaveBeenCalledWith('t1');
  });

  it('delegates update', async () => {
    service.update.mockResolvedValue({ id: 't1' });
    await controller.update('t1', { name: 'Novo' });
    expect(service.update).toHaveBeenCalledWith('t1', { name: 'Novo' });
  });
});
