import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../enums/common.enums';

/**
 * AdminGuard
 *
 * A self-contained guard that ONLY allows users with role === ADMIN.
 * Apply this directly on any @Controller or @UseGuards inside the admin module.
 *
 * It assumes JwtAuthGuard has already run (registered globally via APP_GUARD),
 * so request.user is already populated when this guard executes.
 *
 * Usage:
 *   @UseGuards(AdminGuard)
 *   @Controller('admin/users')
 *   export class AdminUsersController {}
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
