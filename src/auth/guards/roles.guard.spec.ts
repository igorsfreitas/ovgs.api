import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  let guard: RolesGuard;

  const makeCtx = (user?: unknown) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows when no roles metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeCtx())).toBe(true);
  });

  it('allows when the roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(makeCtx())).toBe(true);
  });

  it('allows when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);
    expect(guard.canActivate(makeCtx({ id: 'u1', role: UserRole.Admin }))).toBe(
      true,
    );
  });

  it('forbids when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);
    expect(() =>
      guard.canActivate(makeCtx({ id: 'u1', role: UserRole.Operator })),
    ).toThrow(ForbiddenException);
  });

  it('forbids when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);
    expect(() => guard.canActivate(makeCtx(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
