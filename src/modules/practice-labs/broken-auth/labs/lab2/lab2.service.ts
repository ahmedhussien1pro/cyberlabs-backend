import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private sessions = new Map<string, any>(); // sessionId -> user data

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.sessions.clear();
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Session Fixation - يقبل sessionId من الـ client
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
    sessionId?: string, // ❌ الثغرة: يسمح للـ client يحدد الـ sessionId!
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ❌ الثغرة: استخدام sessionId من الـ client بدل إنشاء واحد جديد
    const finalSessionId = sessionId || this.generateSessionId();

    // تخزين الـ session
    this.sessions.set(finalSessionId, {
      username: user.username,
      role: user.role,
      loginTime: new Date(),
    });

    return {
      success: true,
      sessionId: finalSessionId,
      user,
    };
  }

  // التحقق من الـ session
  async getSession(userId: string, labId: string, sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    return { session };
  }

  // ❌ الثغرة: يسمح بالوصول للبيانات الحساسة بـ sessionId فقط
  async accessProtectedData(userId: string, labId: string, sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // التحقق من الاستغلال
    if (session.username === 'victim') {
      return {
        success: true,
        protectedData: 'Victim sensitive data',
        exploited: true,
        flag: 'FLAG{SESSION_HIJACKED}',
        message: 'Session fixation exploited! Victim session hijacked',
        session,
      };
    }

    return { success: true, protectedData: `Data for ${session.username}` };
  }

  // ❌ الثغرة: Predictable session IDs
  private generateSessionId(): string {
    // ❌ الثغرة: session ID يمكن التنبؤ به
    return `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  // List active sessions (للـ debugging)
  async listSessions(userId: string, labId: string) {
    return {
      sessions: Array.from(this.sessions.entries()).map(([id, data]) => ({
        sessionId: id,
        username: data.username,
        loginTime: data.loginTime,
      })),
    };
  }

  // ❌ الثغرة: No logout functionality or session invalidation
  async logout(userId: string, labId: string, sessionId: string) {
    this.sessions.delete(sessionId);
    return { success: true, message: 'Logged out' };
  }
}
