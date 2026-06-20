import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/** Lógica testável por trás do `@CurrentUser()`. */
export function currentUserFactory(
  _data: unknown,
  ctx: ExecutionContext,
): AuthenticatedUser {
  return ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;
}

/** Injeta o usuário autenticado (resolvido pelo `JwtStrategy`) no handler. */
export const CurrentUser = createParamDecorator(currentUserFactory);
