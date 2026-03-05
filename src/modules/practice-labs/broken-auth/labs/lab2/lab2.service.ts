// src/modules/practice-labs/broken-auth/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: الخوارزمية قابلة للتنبؤ
  private generateRememberToken(email: string, role: string): string {
    const day = Math.floor(Date.now() / 86400000);
    return Buffer.from(`${email}:${role}:${day}`).toString('base64');
  }

  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password required');

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, email, password },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // ✅ إصلاح: null safety
    const rememberToken = this.generateRememberToken(
      user.email ?? '',
      user.role ?? 'user',
    );

    return {
      success: true,
      user: { email: user.email, role: user.role },
      rememberMeToken: rememberToken,
      note: 'Decode this token from Base64 to understand its structure.',
    };
  }

  async getRememberToken(userId: string, labId: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'traveler_nour' },
    });

    if (!user) throw new BadRequestException('Login first');

    // ✅ إصلاح: null safety
    const token = this.generateRememberToken(
      user.email ?? '',
      user.role ?? 'user',
    );
    const decoded = Buffer.from(token, 'base64').toString();

    return {
      success: true,
      rememberMeToken: token,
      decoded,
      hint: 'Pattern: Base64(email:role:dayNumber). Can you forge this for admin@flytrek.io?',
    };
  }

  async forgeToken(userId: string, labId: string, email: string, role: string) {
    if (!email || !role)
      throw new BadRequestException('email and role required');

    const forged = this.generateRememberToken(email, role);
    const decoded = Buffer.from(forged, 'base64').toString();

    return {
      success: true,
      forgedToken: forged,
      decoded,
      algorithm: 'Base64(email:role:dayNumber)',
      note: 'Now use this token in /auth/remember-login',
    };
  }

  // ❌ الثغرة: يثق في الـ token بدون DB lookup
  async rememberLogin(userId: string, labId: string, rememberToken: string) {
    if (!rememberToken)
      throw new BadRequestException('rememberToken is required');

    let decoded: string;
    try {
      decoded = Buffer.from(rememberToken, 'base64').toString();
    } catch {
      throw new BadRequestException('Invalid token format');
    }

    const parts = decoded.split(':');
    if (parts.length < 3) {
      throw new BadRequestException({
        error: 'Invalid token structure',
        hint: 'Token format: Base64(email:role:dayNumber)',
      });
    }

    const [email, role] = parts;

    // ❌ الثغرة: يثق في decoded values بدون التحقق من الـ DB
    const isAdmin = role === 'admin' && email === 'admin@flytrek.io';

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'BROKEN_AUTH',
        action: 'REMEMBER_ME_LOGIN',
        meta: { email, role, decodedToken: decoded, isForged: isAdmin },
      },
    });

    if (isAdmin) {
      return {
        success: true,
        exploited: true,
        loggedInAs: { email, role },
        flag: 'FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
        vulnerability: 'Broken Authentication — Predictable Remember-Me Token',
        impact:
          'Attacker gained persistent admin access without knowing the password by forging a predictable Base64 token.',
        fix: [
          'Use cryptographically random tokens (crypto.randomBytes(64))',
          'Store tokens in the database with userId binding — validate on every use',
          'Set short expiry on remember-me tokens (7-30 days max)',
          'Implement token rotation on each use',
          'Never encode user role or privileges inside client-side tokens',
        ],
      };
    }

    return {
      success: true,
      loggedInAs: { email, role },
      note:
        role !== 'admin'
          ? 'Logged in as regular user. Try forging a token for admin@flytrek.io with role:admin'
          : 'Access granted',
    };
  }
}
