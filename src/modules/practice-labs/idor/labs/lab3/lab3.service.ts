// src/modules/practice-labs/idor/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab3Service {
  // تخزين مؤقت للـ reset tokens
  private resetTokens = new Map<
    string,
    { userId: string; labId: string; ownerUserId: string; expiresAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async requestReset(userId: string, labId: string) {
    const token = crypto.randomBytes(32).toString('hex');

    this.resetTokens.set(token, {
      userId,
      labId,
      ownerUserId: 'user_john', // مربوط بـ user_john
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 دقيقة
    });

    return {
      success: true,
      message: 'Password reset email sent to john@cloudbase.io',
      note: 'In a real system, the token would be emailed. Use /auth/get-token to retrieve it for this lab.',
    };
  }

  async getToken(userId: string, labId: string) {
    // ابحث عن أي token للمستخدم الحالي
    for (const [token, data] of this.resetTokens.entries()) {
      if (data.userId === userId && data.labId === labId) {
        return {
          success: true,
          token,
          hint: 'Use this token in /auth/reset-password. The endpoint also accepts a "targetUserId" — what if you change it to "admin_001"?',
        };
      }
    }

    return {
      success: false,
      error: 'No active reset token. Request one first via /auth/request-reset',
    };
  }

  // ❌ الثغرة: يستخدم targetUserId من الـ request بدلاً من token's ownerUserId
  async resetPassword(
    userId: string,
    labId: string,
    token: string,
    targetUserId: string,
    newPassword: string,
  ) {
    if (!token || !targetUserId || !newPassword) {
      throw new BadRequestException(
        'token, targetUserId, and newPassword are required',
      );
    }

    const tokenData = this.resetTokens.get(token);

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (Date.now() > tokenData.expiresAt) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Token expired');
    }

    // ❌ الثغرة: يبحث عن المستخدم باستخدام targetUserId من الـ request
    // بدلاً من: tokenData.ownerUserId
    const targetUser = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: targetUserId },
    });

    if (!targetUser) {
      throw new BadRequestException({
        error: 'User not found',
        hint: 'Try targetUserId: "user_john" or "admin_cloudbase"',
      });
    }

    // تحديث كلمة المرور
    await this.prisma.labGenericUser.update({
      where: { id: targetUser.id },
      data: { password: newPassword },
    });

    this.resetTokens.delete(token);

    const isSelfReset = targetUserId === 'user_john';
    const isAdminTakeover = targetUser.role === 'admin';

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: isAdminTakeover ? 'EXPLOIT' : 'AUTH',
        action: 'PASSWORD_RESET',
        meta: {
          targetUserId,
          isSelfReset,
          isAdminTakeover,
          timestamp: new Date(),
        },
      },
    });

    if (isAdminTakeover) {
      return {
        success: true,
        exploited: true,
        message: `Password reset for ${targetUserId} successful`,
        vulnerability: 'IDOR — Password Reset userId Manipulation',
        impact:
          'You reset the admin account password using your own valid token. This is a full account takeover.',
        nextStep:
          'Login as admin_cloudbase with your new password to get the flag.',
        fix: 'Bind the reset token to a specific user server-side. Use tokenData.ownerUserId, NOT req.body.userId.',
      };
    }

    return {
      success: true,
      message: `Password for ${targetUserId} has been reset.`,
      note: isSelfReset
        ? 'You reset your own password. Try changing targetUserId to "admin_cloudbase".'
        : "⚠️ You reset another user's password!",
    };
  }

  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.role === 'admin') {
      return {
        success: true,
        exploited: true,
        user: { username: user.username, role: user.role },
        flag: 'FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
        vulnerability: 'IDOR — Password Reset Account Takeover',
        impact:
          'Full admin account takeover achieved via password reset userId manipulation.',
      };
    }

    return {
      success: true,
      user: { username: user.username, role: user.role },
      note: 'Logged in as regular user. Now try to reset the admin password.',
    };
  }
}
