/**
 * [9.2] VmVncTokenGuard
 *
 * Validates that a VNC access token:
 *   1. Exists in the database
 *   2. Has not expired
 *   3. Belongs to the authenticated user
 *   4. Is linked to an active (RUNNING) instance
 *
 * Security controls implemented:
 *   ✅ [9.2] VNC token validation — userId claim in token must match session.userId
 *   ✅ [9.8] VNC token expiry    — tokens expire after VNC_TOKEN_TTL_MIN (default: 15 min)
 *
 * Usage (on VNC access endpoints):
 *   @UseGuards(JwtAuthGuard, VmVncTokenGuard)
 *   @Get('instances/:instanceId/vnc')
 */

import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';

@Injectable()
export class VmVncTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request    = context.switchToHttp().getRequest();
    const userId     = request.user?.id;
    const instanceId = request.params?.instanceId;

    // vncToken comes from query string: GET /instances/:instanceId/vnc?token=...
    const vncToken = request.query?.token as string | undefined;

    if (!vncToken) {
      throw new UnauthorizedException('VNC token is required');
    }

    const session = await this.prisma.vmLabSession.findUnique({
      where: { vncToken },
      include: { instance: { select: { status: true, userId: true } } },
    });

    // [9.8] Token not found
    if (!session) {
      throw new UnauthorizedException('Invalid or expired VNC token');
    }

    // [9.8] Token expired
    if (new Date() > session.vncTokenExpiresAt) {
      throw new UnauthorizedException('VNC token has expired. Please refresh your session.');
    }

    // [9.2] Token must belong to the authenticated user
    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // [9.2] Token must match the requested instance
    if (session.instanceId !== instanceId) {
      throw new ForbiddenException('Token does not match this instance');
    }

    // [9.2] Instance must still be RUNNING
    if (session.instance.status !== VmInstanceStatus.RUNNING) {
      throw new UnauthorizedException(
        'Lab session is no longer active. Status: ' + session.instance.status,
      );
    }

    // Attach session to request for use in controller
    request.vncSession = session;
    return true;
  }
}
