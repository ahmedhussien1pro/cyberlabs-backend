// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ✅ Public: يعرض معلومات المستخدم
  async getUserInfo(userId: string, labId: string, username: string) {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
      select: { id: true, username: true, role: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user,
      note: 'This is a read-only endpoint. To delete, use DELETE /users/delete (admin only)',
    };
  }

  // ✅ Protected: يتطلب admin role
  async deleteUser(userId: string, labId: string, username: string) {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.labGenericUser.delete({ where: { id: user.id } });

    // تسجيل الحذف
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'ADMIN_ACTION',
        action: 'USER_DELETED',
        meta: {
          username,
          deletedBy: 'admin',
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `User ${username} deleted successfully`,
    };
  }

  // ❌ الثغرة: يسمح بـ method override بدون re-authorization
  async userAction(
    userId: string,
    labId: string,
    username: string,
    methodOverride?: string,
    userRole?: string,
  ) {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    // ❌ الثغرة: إذا كان methodOverride === 'DELETE'، ينفذ الحذف بدون التحقق من admin role
    if (methodOverride?.toUpperCase() === 'DELETE') {
      const user = await this.prisma.labGenericUser.findFirst({
        where: { userId, labId, username },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // تحقق من أن المستخدم المستهدف هو carlos
      const isTargetUser = username === 'carlos';

      if (isTargetUser) {
        await this.prisma.labGenericUser.delete({ where: { id: user.id } });

        await this.prisma.labGenericLog.create({
          data: {
            userId,
            labId,
            type: 'EXPLOIT',
            action: 'UNAUTHORIZED_DELETE',
            meta: {
              username,
              method: 'HTTP Method Override',
              header: 'X-HTTP-Method-Override: DELETE',
              timestamp: new Date().toISOString(),
            },
          },
        });

        return {
          success: true,
          exploited: true,
          message: `User ${username} deleted via method override`,
          vulnerability: 'HTTP Method Override + Authorization Bypass',
          exploitDetails:
            'You sent a POST request with X-HTTP-Method-Override: DELETE header. ' +
            'The backend processed it as DELETE without re-checking admin authorization.',
          flag: 'FLAG{HTTP_METHOD_OVERRIDE_ADMIN_DELETE_PWN}',
          impact:
            'You bypassed role-based access control to delete a user account. ' +
            'This could lead to account takeover, data loss, and service disruption.',
          fix:
            '1. Disable method override headers in production, OR\n' +
            '2. Re-validate authorization after method override: ' +
            'if (overriddenMethod === DELETE) { requireAdmin(); }',
        };
      }

      // حذف مستخدم آخر (ليس الهدف)
      await this.prisma.labGenericUser.delete({ where: { id: user.id } });

      return {
        success: true,
        exploited: false,
        message: `User ${username} deleted (not the target). Try username: carlos`,
      };
    }

    // Default: GET behavior
    return this.getUserInfo(userId, labId, username);
  }
}
