import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  const users = { findByEmail: jest.fn() };
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;

  const activeUser: User = {
    id: 'u1',
    email: 'a@b.com',
    passwordHash: 'hash',
    role: UserRole.Operator,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );
  });

  describe('validateUser', () => {
    it('returns the user for valid credentials', async () => {
      users.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.validateUser('a@b.com', 'pw')).resolves.toBe(
        activeUser,
      );
    });

    it('throws when the user does not exist', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('x@y.com', 'pw'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when the user is inactive', async () => {
      users.findByEmail.mockResolvedValue({ ...activeUser, isActive: false });
      await expect(
        service.validateUser('a@b.com', 'pw'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      users.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.validateUser('a@b.com', 'bad'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('returns a signed access token', async () => {
      users.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('signed.jwt');

      await expect(service.login('a@b.com', 'pw')).resolves.toEqual({
        access_token: 'signed.jwt',
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.com',
        role: UserRole.Operator,
      });
    });
  });
});
