import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcryptjs');

describe('UsersService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(repo as unknown as Repository<User>);
  });

  it('creates a user hashing the password and defaulting the role', async () => {
    repo.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    repo.create.mockImplementation((u: Partial<User>) => u);
    repo.save.mockImplementation((u: Partial<User>) => ({ id: 'u1', ...u }));

    const result = await service.create({
      email: 'a@b.com',
      password: 'secret12',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('secret12', 10);
    expect(repo.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      passwordHash: 'hashed',
      role: UserRole.Operator,
    });
    expect(result).toHaveProperty('id', 'u1');
  });

  it('honours an explicit role', async () => {
    repo.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('h');
    repo.create.mockImplementation((u: Partial<User>) => u);
    repo.save.mockImplementation((u: Partial<User>) => u);

    await service.create({
      email: 'admin@b.com',
      password: 'secret12',
      role: UserRole.Admin,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Admin }),
    );
  });

  it('throws when the email is already registered', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1' });
    await expect(
      service.create({ email: 'a@b.com', password: 'secret12' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('finds users by email and id', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1' });
    await service.findByEmail('a@b.com');
    await service.findById('u1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
