import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private sessions = new Map<string, any>(); // sessionId -> { username, csrfToken }

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.sessions.clear();
    return this.stateService.initializeState(userId, labId);
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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = `sess_${Date.now()}`;
    // ❌ الثغرة: Weak CSRF token - يمكن التنبؤ به
    const csrfToken = `csrf_${Date.now()}`;

    this.sessions.set(sessionId, { username, csrfToken });

    return { success: true, sessionId, csrfToken, user };
  }

  // ❌ الثغرة: Weak CSRF validation
  async changePassword(
    userId: string,
    labId: string,
    sessionId: string,
    newPassword: string,
    csrfToken?: string,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // ❌ الثغرة 1: يتحقق من وجود token بس مش من قيمته!
    if (!csrfToken) {
      throw new BadRequestException('CSRF token required');
    }

    // ❌ الثغرة 2: Weak validation - يقبل أي token يبدأ بـ "csrf_"
    if (!csrfToken.startsWith('csrf_')) {
      throw new BadRequestException('Invalid CSRF token format');
    }

    // ❌ الثغرة 3: مابيقارنش مع الـ token الأصلي!
    // المفروض: if (csrfToken !== session.csrfToken)

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: session.username },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: { password: newPassword },
    });

    // التحقق من الاستغلال
    if (csrfToken !== session.csrfToken) {
      return {
        success: true,
        message: 'Password changed',
        exploited: true,
        flag: 'FLAG{CSRF_TOKEN_BYPASSED}',
        warning: 'CSRF bypass! Invalid token accepted',
      };
    }

    return { success: true, message: 'Password changed' };
  }

  // ❌ الثغرة: يقبل CSRF token في GET parameter
  async deleteAccount(
    userId: string,
    labId: string,
    sessionId: string,
    csrfToken?: string,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // ❌ الثغرة: Optional CSRF token!
    if (csrfToken && csrfToken === session.csrfToken) {
      // Token صحيح
    } else if (!csrfToken) {
      // ❌ يسمح بالعملية بدون token!
    } else {
      throw new BadRequestException('Invalid CSRF token');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: session.username },
    });

    if (user) {
      // حذف المستخدم (في الحقيقة نعلمه كـ deleted)
      await this.prisma.labGenericLog.create({
        data: {
          userId,
          labId,
          type: 'ACCOUNT_DELETED',
          meta: { username: session.username },
        },
      });
    }

    return { success: true, message: 'Account deleted' };
  }

  // ❌ الثغرة: Token reuse - نفس الـ token يشتغل أكتر من مرة
  async sensitiveAction(
    userId: string,
    labId: string,
    sessionId: string,
    csrfToken: string,
    action: string,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // ❌ الثغرة: Token مابيتغيرش بعد كل استخدام
    // المفروض: one-time use token
    if (csrfToken !== session.csrfToken) {
      throw new BadRequestException('Invalid CSRF token');
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'SENSITIVE_ACTION',
        meta: { action, username: session.username },
      },
    });

    return { success: true, message: `Action ${action} completed` };
  }

  async getSession(userId: string, labId: string, sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    return { session };
  }
}
