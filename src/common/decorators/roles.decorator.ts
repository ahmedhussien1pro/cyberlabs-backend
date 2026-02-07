import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/common.enums';

/**
 * Roles Decorator
 * Sets required roles for route access
 * Usage: @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
