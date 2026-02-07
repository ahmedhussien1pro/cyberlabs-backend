import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private verificationSteps = new Map<string, Set<string>>(); // labKey -> completed steps

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const key = `${userId}-${labId}`;
    this.verificationSteps.set(key, new Set());
    return this.stateService.initializeState(userId, labId);
  }

  async verifyStep(userId: string, labId: string, step: string) {
    const key = `${userId}-${labId}`;
    const steps = this.verificationSteps.get(key) || new Set();
    steps.add(step);
    this.verificationSteps.set(key, steps);

    return {
      success: true,
      message: `${step} completed`,
      completedSteps: Array.from(steps),
    };
  }

  async getStatus(userId: string, labId: string) {
    const key = `${userId}-${labId}`;
    const steps = this.verificationSteps.get(key) || new Set();

    return {
      completedSteps: Array.from(steps),
      totalSteps: 3,
      isFullyVerified: steps.size >= 3,
    };
  }

  // ❌ الثغرة: Workflow Bypass - يتحقق بشكل ضعيف
  async accessPremiumFeature(userId: string, labId: string) {
    const key = `${userId}-${labId}`;
    const steps = this.verificationSteps.get(key) || new Set();

    // ❌ الثغرة: التحقق ضعيف - يكفي 2 steps بدل 3
    // أو يمكن bypass بإرسال step names خاطئة
    if (steps.size < 2) {
      throw new ForbiddenException('Complete verification steps first');
    }

    // تسجيل الوصول
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'PREMIUM_ACCESS',
        meta: { steps: Array.from(steps) },
      },
    });

    return {
      success: true,
      premiumData: 'FLAG{WORKFLOW_BYPASS_SUCCESS}',
      message: 'Premium feature accessed',
      completedSteps: Array.from(steps),
    };
  }

  // ❌ الثغرة: Direct Access - endpoint مكشوف بدون proper checks
  async directPremiumAccess(userId: string, labId: string, secretKey?: string) {
    // ❌ الثغرة: secret key مكشوف في الكود أو سهل التخمين
    if (secretKey === 'bypass-workflow-2024') {
      return {
        success: true,
        exploited: true,
        flag: 'FLAG{WORKFLOW_BYPASS_SUCCESS}',
        message: 'Workflow completely bypassed using secret key!',
        premiumData: 'Full access granted',
      };
    }

    // Fallback to normal check
    return this.accessPremiumFeature(userId, labId);
  }

  // ❌ الثغرة: يمكن تزوير الـ steps
  async completeAllSteps(userId: string, labId: string, steps: string[]) {
    const key = `${userId}-${labId}`;
    // ❌ يقبل أي steps من الـ client بدون validation!
    this.verificationSteps.set(key, new Set(steps));

    return {
      success: true,
      message: 'All steps marked as completed',
      completedSteps: steps,
    };
  }
}
