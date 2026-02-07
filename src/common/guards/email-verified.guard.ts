import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Email Verified Guard
 * Ensures user has verified their email
 * Some routes may skip this requirement using @AllowUnverified() decorator
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route allows unverified emails
    const allowUnverified = this.reflector.getAllAndOverride<boolean>(
      'allowUnverifiedEmail',
      [context.getHandler(), context.getClass()],
    );

    if (allowUnverified) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address to access this resource',
      );
    }

    return true;
  }
}
