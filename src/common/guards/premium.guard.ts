import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../enums/common.enums';

/**
 * Premium Guard
 * Ensures user has premium subscription
 * Admins and instructors bypass this check
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins and instructors have access
    if (user.role === UserRole.ADMIN || user.role === UserRole.INSTRUCTOR) {
      return true;
    }

    // Check premium status
    if (!user.isPremium) {
      throw new ForbiddenException(
        'This content requires a premium subscription',
      );
    }

    return true;
  }
}
