import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: No rate limiting على login attempts
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    // تسجيل المحاولة
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LOGIN_ATTEMPT',
        meta: { username, success: false },
      },
    });

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // تحديث الـ log للـ success
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LOGIN_SUCCESS',
        meta: { username, role: user.role },
      },
    });

    // عد المحاولات الفاشلة
    const attempts = await this.prisma.labGenericLog.count({
      where: { userId, labId, type: 'LOGIN_ATTEMPT' },
    });

    // التحقق من الاستغلال
    if (username === 'admin' && attempts > 5) {
      return {
        success: true,
        user,
        exploited: true,
        flag: 'FLAG{WEAK_PASSWORD_BRUTE_FORCED}',
        message: 'Weak password exploited! Admin account accessed',
        attempts,
      };
    }

    return { success: true, user };
  }

  // ❌ الثغرة: Weak password registration allowed
  async register(
    userId: string,
    labId: string,
    username: string,
    password: string,
    email: string,
  ) {
    // ❌ الثغرة: مافيش password strength validation
    // يقبل passwords زي: "123", "pass", "admin"

    const existing = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (existing) {
      throw new UnauthorizedException('Username already exists');
    }

    const user = await this.prisma.labGenericUser.create({
      data: {
        userId,
        labId,
        username,
        password, // ❌ يخزن plain text!
        email,
        role: 'USER',
      },
    });

    return { success: true, user };
  }

  // ❌ الثغرة: Password reset بدون proper verification
  async resetPassword(
    userId: string,
    labId: string,
    username: string,
    email: string,
    newPassword: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // ❌ الثغرة: يغير الـ password بمجرد معرفة username + email
    // مافيش OTP أو verification code
    await this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: { password: newPassword },
    });

    return { success: true, message: 'Password reset successful' };
  }

  // Hint endpoint لمساعدة المتدرب
  async getHint(userId: string, labId: string) {
    return {
      hint: 'Try common passwords like: 123456, password, admin, qwerty',
      commonPasswords: ['123456', 'password', 'admin', 'qwerty', '12345678'],
    };
  }
}
