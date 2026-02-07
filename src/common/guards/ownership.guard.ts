import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../enums/common.enums';

/**
 * Ownership Guard
 * Ensures user can only access their own resources
 * Admins bypass this check
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can access any resource
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user is accessing their own resource
    const userId = params.id || params.userId;

    if (userId && userId !== user.id) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}
