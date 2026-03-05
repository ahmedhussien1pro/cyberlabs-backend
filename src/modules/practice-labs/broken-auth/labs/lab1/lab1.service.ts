// src/modules/practice-labs/broken-auth/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  private loginAttempts = new Map<string, number>(); // userId → attempt count

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.loginAttempts.set(userId, 0);
    return this.stateService.initializeState(userId, labId);
  }

  async getLeakedPasswords(userId: string, labId: string) {
    const leaked = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, author: 'leaked_db' },
    });

    const passwords = leaked ? JSON.parse(leaked.body) : [];

    return {
      success: true,
      source: 'HaveIBeenPwned Database Breach — 2023',
      totalPasswords: passwords.length,
      passwords,
      note: 'These passwords were found in real data breaches. Try them against admin@streamvault.io',
    };
  }

  // ❌ الثغرة: بدون rate limiting أو lockout
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password required');

    const attempts = (this.loginAttempts.get(userId) || 0) + 1;
    this.loginAttempts.set(userId, attempts);

    const targetUser = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, email },
    });

    if (!targetUser || targetUser.password !== password) {
      return {
        success: false,
        error: 'Invalid credentials',
        attemptNumber: attempts,
        // ❌ الثغرة: يكشف عن عدد المحاولات بدون حد
        note:
          attempts > 5
            ? `⚠️ ${attempts} failed attempts — no lockout triggered! Keep trying.`
            : 'Invalid credentials',
      };
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'BROKEN_AUTH',
        action: 'CREDENTIAL_STUFFING_SUCCESS',
        meta: { email, totalAttempts: attempts, password },
      },
    });

    return {
      success: true,
      exploited: true,
      token: `lab_session_${Buffer.from(email + ':' + password).toString('base64')}`,
      user: { email: targetUser.email, role: targetUser.role },
      totalAttempts: attempts,
      flag: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      vulnerability:
        'Broken Authentication — No Rate Limiting / No Account Lockout',
      impact: `Account compromised after ${attempts} attempts. In a real attack, this would be automated at thousands of attempts per second.`,
      fix: [
        'Implement rate limiting: max 5 attempts per account per 15 minutes',
        'Account lockout after N failed attempts with email notification',
        'Add CAPTCHA after 3 failed attempts',
        'Use IP-based throttling in addition to account-based',
        'Implement multi-factor authentication',
      ],
    };
  }

  async bruteForceSimulate(userId: string, labId: string, targetEmail: string) {
    if (!targetEmail) throw new BadRequestException('targetEmail is required');

    const leaked = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, author: 'leaked_db' },
    });

    const passwords: string[] = leaked ? JSON.parse(leaked.body) : [];
    let foundPassword: string | null = null;
    let attempts = 0;

    for (const pwd of passwords) {
      attempts++;
      const result = await this.login(userId, labId, targetEmail, pwd);
      if (result.success) {
        foundPassword = pwd;
        break;
      }
    }

    if (!foundPassword) {
      return {
        success: false,
        attempts,
        message: 'Password not found in leaked list',
      };
    }

    return {
      success: true,
      exploited: true,
      foundPassword,
      attempts,
      message: `Password found after ${attempts} attempts — no rate limit triggered!`,
      flag: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
    };
  }
}
