import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  let guard: JwtAuthGuard;

  const ctx = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  it('allows public routes without authentication', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('delegates to the passport guard for protected routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const parent = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: (c: ExecutionContext) => boolean;
    };
    const superSpy = jest.spyOn(parent, 'canActivate').mockReturnValue(true);

    expect(guard.canActivate(ctx)).toBe(true);
    expect(superSpy).toHaveBeenCalledWith(ctx);

    superSpy.mockRestore();
  });
});
