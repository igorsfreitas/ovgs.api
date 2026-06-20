import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from './entities/user.entity';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

describe('AuthController', () => {
  const auth = { login: jest.fn() };
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(auth as unknown as AuthService);
  });

  it('delegates login to the auth service', async () => {
    auth.login.mockResolvedValue({ access_token: 'token' });

    await expect(
      controller.login({ email: 'a@b.com', password: 'secret12' }),
    ).resolves.toEqual({ access_token: 'token' });
    expect(auth.login).toHaveBeenCalledWith('a@b.com', 'secret12');
  });

  it('returns the current authenticated user', () => {
    const user: AuthenticatedUser = {
      id: 'u1',
      email: 'a@b.com',
      role: UserRole.Admin,
    };
    expect(controller.me(user)).toBe(user);
  });
});
