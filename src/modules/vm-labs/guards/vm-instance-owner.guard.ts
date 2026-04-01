/**
 * [9.5] VmInstanceOwnerGuard
 *
 * Enforces that the authenticated user owns the requested instance.
 * Applies to any route with :instanceId param.
 *
 * Security controls implemented:
 *   ✅ [9.5] Instance ownership — userId must match instance.userId
 *   ✅ Returns 403 Forbidden (not 404) so attackers cannot enumerate instance IDs
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, VmInstanceOwnerGuard)
 *   @Get('instances/:instanceId')
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class VmInstanceOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request    = context.switchToHttp().getRequest();
    const user       = request.user;
    const instanceId = request.params?.instanceId;

    // Guard only applies when :instanceId param is present
    if (!instanceId) return true;

    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
      select: { userId: true },
    });

    // Return 403 (not 404) to prevent instance ID enumeration
    if (!instance) {
      throw new ForbiddenException('Access denied');
    }

    // Admin bypass — admins can access any instance
    const isAdmin = user?.role === 'ADMIN' || user?.roles?.includes('ADMIN');
    if (isAdmin) return true;

    if (instance.userId !== user?.id) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
