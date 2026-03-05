// src/modules/practice-labs/broken-auth/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab4Service {
  private tokenDenylist = new Set<string>();
  private activeSessions = new Map<
    string,
    { email: string; role: string; loggedOut: boolean }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.tokenDenylist.clear();
    this.activeSessions.clear();
    return this.stateService.initializeState(userId, labId);
  }

  async labLogin(
    userId: string,
    labId: string,
    email: string,
    password: string,
  ) {
    if (!email || !password)
      throw new BadRequestException('email and password required');

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, email, password },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const sessionToken = crypto.randomBytes(32).toString('hex');

    // ✅ إصلاح: null safety
    this.activeSessions.set(sessionToken, {
      email: user.email ?? '',
      role: user.role ?? 'employee',
      loggedOut: false,
    });

    return {
      success: true,
      sessionToken,
      user: { email: user.email, role: user.role },
      instruction:
        '⚠️ Save this sessionToken! You will need it after logout to demonstrate the vulnerability.',
    };
  }

  // ❌ الثغرة: logout لا يُلغي الـ token server-side
  async logout(userId: string, labId: string, sessionToken: string) {
    if (!sessionToken) throw new BadRequestException('sessionToken required');

    const session = this.activeSessions.get(sessionToken);
    if (!session) throw new BadRequestException('Session not found');

    // ❌ الثغرة: يُعلّم كـ loggedOut لكن لا يُضيفه للـ denylist
    session.loggedOut = true;

    return {
      success: true,
      message: 'Successfully logged out',
      note: 'Your session cookie has been cleared. You are now logged out.',
      hint: '🤔 But is the token truly invalidated server-side? Try using it again...',
    };
  }

  // ❌ الثغرة: يتحقق من صحة الـ token فقط — لا يتحقق من الـ denylist
  async accessAdminDashboard(
    userId: string,
    labId: string,
    sessionToken: string,
  ) {
    if (!sessionToken)
      throw new UnauthorizedException('No session token provided');

    const session = this.activeSessions.get(sessionToken);

    if (!session) {
      throw new UnauthorizedException({
        error: 'Invalid session token',
        hint: 'Use the token you received during login',
      });
    }

    // ❌ الثغرة: لا يتحقق من session.loggedOut أو tokenDenylist
    const wasLoggedOut = session.loggedOut;

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'BROKEN_AUTH',
        action: 'POST_LOGOUT_ACCESS',
        meta: {
          email: session.email,
          role: session.role,
          wasLoggedOut,
          sessionToken,
        },
      },
    });

    if (wasLoggedOut) {
      return {
        success: true,
        exploited: true,
        accessedAs: { email: session.email, role: session.role },
        flag: 'FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
        vulnerability:
          'Broken Authentication — Server-Side Session Not Invalidated on Logout',
        impact:
          'An attacker who captured this token (via XSS, network sniff, or shoulder surf) has permanent access even after the legitimate user logs out.',
        proofOfExploit: [
          '1. ✅ Logged in → received session token',
          '2. ✅ Called /auth/logout → server confirmed logout',
          '3. ✅ Used OLD token → server accepted it!',
          '4. ✅ Full dashboard access gained post-logout',
        ],
        fix: [
          'Maintain server-side token denylist — add tokens on logout',
          'Use short-lived tokens (15-30 min) + refresh token rotation',
          'Store session state in Redis — delete entry on logout',
          'Implement token versioning: user has a "token version" in DB, increment on logout',
        ],
      };
    }

    return {
      success: true,
      message: 'Access granted (you are still logged in)',
      user: { email: session.email, role: session.role },
      hint: 'First logout, then try using the same token again.',
    };
  }
}
