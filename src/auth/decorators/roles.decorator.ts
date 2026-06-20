import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';

/** Restringe uma rota aos papéis informados (avaliado pelo `RolesGuard`). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
