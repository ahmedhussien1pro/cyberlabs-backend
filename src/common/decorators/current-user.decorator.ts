import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../types/common.types';

/**
 * Current User Decorator
 * Extracts current user from request
 * Usage: @CurrentUser() user: RequestUser
 * Usage: @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
