import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private loginAttempts = new Map<string, number>(); // Simple in-memory counter

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.loginAttempts.clear();
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Weak Rate Limiting - يمكن تجاوزه بسهولة
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const key = `${userId}-${labId}-${username}`;

    // ❌ Rate limiting ضعيف جداً
    const attempts = this.loginAttempts.get(key) || 0;

    if (attempts >= 3) {
      // ❌ الثغرة: الـ counter بسيط ومخزن في memory، يمكن reset بإعادة تشغيل
      // أو bypass بتغيير username case أو إضافة spaces
      throw new HttpException(
        'Too many attempts, wait 1 minute',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.loginAttempts.set(key, attempts + 1);

    // محاولة تسجيل الدخول
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) {
      // تسجيل المحاولة الفاشلة
      await this.prisma.labGenericLog.create({
        data: { userId, labId, type: 'LOGIN_FAIL' },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // نجح! حذف الـ counter
    this.loginAttempts.delete(key);

    // عد المحاولات الفاشلة
    const failedAttempts = await this.prisma.labGenericLog.count({
      where: { userId, labId, type: 'LOGIN_FAIL' },
    });

    // التحقق من الاستغلال (لو عمل محاولات كتير)
    if (failedAttempts >= 10) {
      return {
        success: true,
        user,
        exploited: true,
        flag: 'FLAG{RATE_LIMIT_BYPASSED}',
        message: 'Rate limiting bypassed! Brute force successful',
        attemptsMade: failedAttempts,
      };
    }

    return { success: true, user };
  }

  // ❌ الثغرة: No rate limiting على API endpoints أخرى
  async checkUsername(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    // يكشف معلومات حساسة بدون rate limiting
    return { exists: !!user };
  }

  // Reset rate limit (للاختبار)
  async resetRateLimit(userId: string, labId: string, username: string) {
    const key = `${userId}-${labId}-${username}`;
    this.loginAttempts.delete(key);
    return { success: true, message: 'Rate limit reset' };
  }
}
