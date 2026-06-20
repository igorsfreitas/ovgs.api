import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const users = { findById: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('test-secret-1234567890') };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('test-secret-1234567890');
    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      users as unknown as UsersService,
    );
  });

  it('returns the authenticated user for a valid payload', async () => {
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: UserRole.Admin,
      isActive: true,
    });

    await expect(
      strategy.validate({ sub: 'u1', email: 'a@b.com', role: 'ADMIN' }),
    ).resolves.toEqual({ id: 'u1', email: 'a@b.com', role: UserRole.Admin });
  });

  it('throws when the user is missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'x', email: '', role: '' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when the user is inactive', async () => {
    users.findById.mockResolvedValue({ isActive: false });
    await expect(
      strategy.validate({ sub: 'x', email: '', role: '' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
