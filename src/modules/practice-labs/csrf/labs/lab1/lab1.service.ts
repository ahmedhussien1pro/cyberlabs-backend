// src/modules/practice-labs/csrf/labs/lab1/lab1.service.ts
// Refactored (PR #3):
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - Exploit condition delegated to CsrfDetectorEngine.basicCrossOrigin()
//  - FlagRecordService wired in

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { CsrfDetectorEngine } from '../../../shared/engines/csrf-detector.engine';

const LAB_SECRET  = 'csrf_lab1_email_hijack_connecthub_2025';
const FLAG_PREFIX = 'CSRF_LAB1';
const TRUSTED_DOMAIN = 'connecthub.io';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, labId, 'attempt-1', flag);
    return state;
  }

  async getAccountInfo(userId: string, labId: string) {
    const victim = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'victim_alice' },
    });
    return {
      success: true,
      account: { username: victim?.username, email: victim?.email || 'alice@connecthub.io', role: victim?.role },
      note: 'The victim is logged in. Their session cookie is automatically sent with every request to this domain.',
    };
  }

  async changeEmail(userId: string, labId: string, newEmail: string, origin?: string, referer?: string) {
    if (!newEmail) throw new BadRequestException('newEmail is required');

    const victim = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'victim_alice' },
    });
    if (!victim) throw new BadRequestException('Victim account not initialized');

    const oldEmail = victim.email;

    await this.prisma.labGenericUser.update({
      where: { id: victim.id },
      data: { email: newEmail },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId, labId, type: 'CSRF', action: 'EMAIL_CHANGE',
        meta: { oldEmail, newEmail, origin: origin || 'unknown', referer: referer || 'none' },
      },
    });

    const { exploited, reason } = CsrfDetectorEngine.basicCrossOrigin({
      origin, trustedDomain: TRUSTED_DOMAIN,
    });

    if (exploited && newEmail !== 'alice@connecthub.io') {
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        message: 'Email changed successfully', oldEmail, newEmail,
        exploitReason: reason,
        flag,
        vulnerability: 'CSRF — No Token, No Origin Validation',
        impact:
          `The victim's email was changed to ${newEmail}. ` +
          'The attacker can now trigger a password reset to take full control of the account.',
        fix: [
          'Implement CSRF tokens: generate a unique token per session, validate on every state-changing request',
          'Validate Origin/Referer headers: reject requests from untrusted origins',
          'Use SameSite=Strict cookie attribute to prevent cross-site cookie sending',
        ],
      };
    }

    return { success: true, exploited: false, message: 'Email changed', newEmail };
  }

  async simulateVictim(userId: string, labId: string, attackerEmail: string) {
    if (!attackerEmail) throw new BadRequestException('attackerEmail is required');
    return this.changeEmail(userId, labId, attackerEmail, 'https://evil-attacker.com', undefined);
  }
}
