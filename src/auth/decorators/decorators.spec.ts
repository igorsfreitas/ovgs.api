import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { currentUserFactory } from './current-user.decorator';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';

describe('auth decorators', () => {
  it('Public() and Roles() produce decorator functions', () => {
    expect(typeof Public()).toBe('function');
    expect(typeof Roles(UserRole.Admin, UserRole.Operator)).toBe('function');
  });

  it('currentUserFactory extracts the user from the request', () => {
    const user = { id: 'u1', email: 'a@b.com', role: UserRole.Admin };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, ctx)).toBe(user);
  });
});
