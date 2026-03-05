// src/modules/practice-labs/broken-auth/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

interface OtpSession {
  email: string;
  labId: string;
  expectedOtp: string;
  otpAttempts: number;
  locked: boolean;
  fullToken?: string;
}

@Injectable()
export class Lab5Service {
  private otpSessions = new Map<string, OtpSession>();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.otpSessions.clear();
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = crypto.randomBytes(16).toString('hex');

    // ✅ إصلاح: null safety
    this.otpSessions.set(sessionId, {
      email: user.email ?? '',
      labId,
      expectedOtp: otp,
      otpAttempts: 0,
      locked: false,
    });

    return {
      success: true,
      message: 'Credentials verified. OTP sent to your registered phone.',
      sessionId,
      mfaRequired: true,
      labOtpHint:
        'OTP sent (lab simulation): The OTP is hidden. Use race condition to bypass the 3-attempt limit.',
      hint: 'You have 3 attempts before lockout. But can you bypass this with concurrent requests?',
    };
  }

  // ❌ الثغرة: check-then-increment ليس atomic
  async verifyOtp(
    userId: string,
    labId: string,
    sessionId: string,
    otp: string,
  ) {
    if (!sessionId || !otp)
      throw new BadRequestException('sessionId and otp required');

    const session = this.otpSessions.get(sessionId);
    if (!session) throw new BadRequestException('Invalid session');

    // ❌ Race condition: check و increment ليسا atomic
    if (session.locked || session.otpAttempts >= 3) {
      throw new HttpException(
        {
          error: 'Too many OTP attempts. Session locked.',
          attempts: session.otpAttempts,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ❌ الثغرة: الـ increment يحدث بعد الـ check
    session.otpAttempts += 1;

    if (otp !== session.expectedOtp) {
      if (session.otpAttempts >= 3) {
        session.locked = true;
      }
      return {
        success: false,
        error: 'Invalid OTP',
        attemptsRemaining: Math.max(0, 3 - session.otpAttempts),
      };
    }

    const fullToken = crypto.randomBytes(32).toString('hex');
    session.fullToken = fullToken;

    return {
      success: true,
      accessToken: fullToken,
      message: 'MFA verified successfully',
    };
  }

  // محاكاة race condition — إرسال طلبات متزامنة
  async raceOtpAttack(
    userId: string,
    labId: string,
    sessionId: string,
    otpGuesses: string[],
  ) {
    if (!sessionId || !otpGuesses?.length) {
      throw new BadRequestException('sessionId and otpGuesses array required');
    }

    const session = this.otpSessions.get(sessionId);
    if (!session) throw new BadRequestException('Invalid session');

    if (session.locked) {
      throw new BadRequestException(
        'Session already locked — start a new login',
      );
    }

    const originalAttempts = session.otpAttempts;

    // ❌ محاكاة Race Condition: كل الطلبات ترى نفس القيمة
    const results = await Promise.all(
      otpGuesses.map(async (guess) => {
        const currentAttempts = originalAttempts;

        if (currentAttempts >= 3) {
          return { otp: guess, result: 'blocked' };
        }

        if (guess === session.expectedOtp) {
          const fullToken = crypto.randomBytes(32).toString('hex');
          session.fullToken = fullToken;
          return { otp: guess, result: 'SUCCESS', accessToken: fullToken };
        }

        return { otp: guess, result: 'invalid' };
      }),
    );

    // بعد كل الطلبات — الـ counter يزيد مرة واحدة فقط
    session.otpAttempts = originalAttempts + 1;

    const successResult = results.find((r) => r.result === 'SUCCESS');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'BROKEN_AUTH',
        action: 'MFA_RACE_CONDITION_ATTACK',
        meta: {
          sessionId,
          totalGuesses: otpGuesses.length,
          successfulOtp: successResult ? session.expectedOtp : null,
          counterAfterAttack: session.otpAttempts,
        },
      },
    });

    if (successResult) {
      return {
        success: true,
        exploited: true,
        raceConditionProof: {
          totalConcurrentRequests: otpGuesses.length,
          counterIncrementedBy: 1,
          expectedCounterWithoutRace: otpGuesses.length,
          actualCounter: session.otpAttempts,
        },
        results,
        accessToken: successResult.accessToken,
        nextStep: 'Use accessToken in /banking/dashboard to get the flag.',
      };
    }

    return {
      success: false,
      results,
      message: 'OTP not found in this batch. Try different OTP range.',
      counterAfterAttack: session.otpAttempts,
      racingProof: `Sent ${otpGuesses.length} concurrent requests but counter only incremented by 1`,
    };
  }

  async bankingDashboard(userId: string, labId: string, accessToken: string) {
    if (!accessToken) throw new UnauthorizedException('accessToken required');

    let foundSession: OtpSession | undefined;
    for (const session of this.otpSessions.values()) {
      if (session.fullToken === accessToken) {
        foundSession = session;
        break;
      }
    }

    if (!foundSession) {
      throw new UnauthorizedException({
        error: 'Invalid access token',
        hint: 'Use the accessToken from /auth/race-otp-attack',
      });
    }

    const bankAccount = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId },
    });

    return {
      success: true,
      exploited: true,
      customer: { email: foundSession.email },
      bankAccount: bankAccount
        ? {
            accountNo: bankAccount.accountNo,
            balance: bankAccount.balance,
            owner: bankAccount.ownerName,
          }
        : null,
      flag: 'FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      vulnerability:
        'Broken Authentication — MFA OTP Bypass via Race Condition',
      technicalDetails: {
        issue: 'Non-atomic check-then-increment on OTP attempt counter',
        window:
          'All concurrent requests read attempts=0 before any write completes',
        result: 'Effectively unlimited guesses in a single time window',
      },
      fix: [
        'Use atomic database operations: UPDATE ... WHERE attempts < 3',
        'Use Redis with Lua scripts for atomic counter operations',
        'Implement distributed locking (Redis SETNX) per sessionId',
        'Use database transactions with pessimistic locking for OTP validation',
        'Consider TOTP (Time-based OTP) with speakeasy — inherently race-resistant',
      ],
    };
  }
}
