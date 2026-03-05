// src/modules/practice-labs/broken-auth/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab3Service {
  private resetTokens = new Map<
    string,
    { email: string; labId: string; token: string }
  >();
  private analyticsLogs: any[] = [];

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.analyticsLogs = [];
    return this.stateService.initializeState(userId, labId);
  }

  async requestReset(userId: string, labId: string, email: string) {
    if (!email) throw new BadRequestException('email is required');

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, email },
    });

    if (!user) throw new BadRequestException('Email not found');

    // ❌ الثغرة: token في URL
    const token = crypto.randomBytes(24).toString('hex');
    this.resetTokens.set(userId + labId, { email, labId, token });

    const resetUrl = `https://medicare.io/reset-password?token=${token}`;

    return {
      success: true,
      message: `Password reset email sent to ${email}`,
      // للـ lab — يعرض الـ URL مباشرة
      resetLink: resetUrl,
      warning:
        '⚠️ The token is in the URL query string. Visit this link to simulate the attack.',
      nextStep:
        'Use /auth/simulate-page-visit with this URL to simulate the victim visiting the page.',
    };
  }

  // محاكاة الضحية تزور صفحة الـ reset → يتسرب الـ token
  async simulatePageVisit(userId: string, labId: string, resetUrl: string) {
    if (!resetUrl) throw new BadRequestException('resetUrl is required');

    // محاكاة browser يرسل Referer للـ analytics script
    const analyticsLog = {
      timestamp: new Date().toISOString(),
      event: 'page_view',
      referer: resetUrl, // ❌ الـ URL الكامل مع الـ token
      origin: 'https://medicare.io',
      userAgent: 'Mozilla/5.0 (victim browser)',
      analyticsEndpoint: 'https://analytics.thirdparty.io/track',
      note: 'Browser automatically sent full URL in Referer header when loading external analytics script',
    };

    this.analyticsLogs.push(analyticsLog);

    return {
      success: true,
      message: 'Page visited successfully',
      whatHappened: [
        '1. Victim opened reset link in browser',
        '2. Browser loaded page: ' + resetUrl,
        '3. Page HTML contains: <script src="https://analytics.thirdparty.io/track.js">',
        '4. Browser sent request to analytics.thirdparty.io',
        '5. ❌ Browser included Referer: ' +
          resetUrl +
          ' in the analytics request',
        '6. Token is now logged in the analytics server',
      ],
      nextStep:
        'Check /analytics/logs to see the leaked token in the Referer header.',
    };
  }

  async getAnalyticsLogs(userId: string, labId: string) {
    if (this.analyticsLogs.length === 0) {
      return {
        success: false,
        logs: [],
        hint: 'No logs yet. First call /auth/simulate-page-visit with the reset URL.',
      };
    }

    return {
      success: true,
      logs: this.analyticsLogs,
      hint: 'Extract the token from the "referer" field query parameter: ?token=<TOKEN>',
      nextStep:
        'Use the extracted token in /auth/do-reset with your new password.',
    };
  }

  async doReset(
    userId: string,
    labId: string,
    token: string,
    newPassword: string,
  ) {
    if (!token || !newPassword) {
      throw new BadRequestException('token and newPassword are required');
    }

    const stored = this.resetTokens.get(userId + labId);
    if (!stored || stored.token !== token) {
      throw new BadRequestException({
        error: 'Invalid or expired reset token',
        hint: 'Extract the token from /analytics/logs → referer field',
      });
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, email: stored.email },
    });

    if (!user) throw new BadRequestException('User not found');

    await this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: { password: newPassword },
    });

    this.resetTokens.delete(userId + labId);

    const isExploited = user.role === 'doctor';

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        resetFor: stored.email,
        flag: 'FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
        vulnerability:
          'Broken Authentication — Password Reset Token Leaked via HTTP Referer Header',
        attackChain: [
          '1. Triggered password reset → token embedded in URL',
          '2. Victim visited reset page in browser',
          '3. Page loaded external analytics script',
          '4. Browser sent full URL (with token) in Referer header to analytics.thirdparty.io',
          '5. Attacker read token from analytics logs',
          "6. Used token to reset doctor's password → full account takeover",
        ],
        impact:
          'Doctor account compromised. Attacker can access patient medical records, prescriptions, and confidential health data.',
        fix: [
          'Use POST body for reset tokens, never URL query parameters',
          'Add Referrer-Policy: no-referrer header to the reset page',
          'Never load third-party scripts on sensitive pages (reset, payment, MFA)',
          'Use short-lived, single-use tokens stored server-side',
        ],
      };
    }

    return {
      success: true,
      message: 'Password reset successful',
      resetFor: stored.email,
    };
  }
}
