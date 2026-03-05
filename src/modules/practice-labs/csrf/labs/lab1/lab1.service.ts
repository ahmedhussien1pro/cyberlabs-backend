// src/modules/practice-labs/csrf/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  async getAccountInfo(userId: string, labId: string) {
    const victim = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'victim_alice' },
    });

    return {
      success: true,
      account: {
        username: victim?.username,
        email: victim?.email || 'alice@connecthub.io',
        role: victim?.role,
      },
      note: 'The victim is logged in. Their session cookie is automatically sent with every request to this domain.',
    };
  }

  // ❌ الثغرة: بدون CSRF token + بدون Origin validation
  async changeEmail(
    userId: string,
    labId: string,
    newEmail: string,
    origin?: string,
    referer?: string,
  ) {
    if (!newEmail) throw new BadRequestException('newEmail is required');

    // ❌ الثغرة: لا يتحقق من Origin أو Referer
    // if (origin && !origin.includes('connecthub.io')) throw ForbiddenException ← مفقود!

    const victim = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'victim_alice' },
    });

    if (!victim)
      throw new BadRequestException('Victim account not initialized');

    const oldEmail = victim.email;

    await this.prisma.labGenericUser.update({
      where: { id: victim.id },
      data: { email: newEmail },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CSRF',
        action: 'EMAIL_CHANGE',
        meta: {
          oldEmail,
          newEmail,
          origin: origin || 'unknown',
          referer: referer || 'none',
        },
      },
    });

    const isExploited =
      newEmail !== 'alice@connecthub.io' &&
      (!origin || !origin.includes('connecthub'));

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        message: 'Email changed successfully',
        oldEmail,
        newEmail,
        flag: 'FLAG{CSRF_BASIC_EMAIL_HIJACK_NO_TOKEN_SOCIAL}',
        vulnerability: 'CSRF — No Token, No Origin Validation',
        impact:
          "The victim's email was changed to " +
          newEmail +
          '. ' +
          'The attacker can now trigger a password reset to take full control of the account.',
        fix: [
          'Implement CSRF tokens: generate a unique token per session, validate on every state-changing request',
          'Validate Origin/Referer headers: reject requests from untrusted origins',
          'Use SameSite=Strict cookie attribute to prevent cross-site cookie sending',
        ],
      };
    }

    return {
      success: true,
      exploited: false,
      message: 'Email changed',
      newEmail,
    };
  }

  async simulateVictim(userId: string, labId: string, attackerEmail: string) {
    if (!attackerEmail)
      throw new BadRequestException('attackerEmail is required');

    // محاكاة الضحية تزور الصفحة الخبيثة
    return this.changeEmail(
      userId,
      labId,
      attackerEmail,
      'https://evil-attacker.com',
      undefined,
    );
  }
}
