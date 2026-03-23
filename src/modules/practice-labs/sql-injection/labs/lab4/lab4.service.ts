// src/modules/practice-labs/sql-injection/labs/lab4/lab4.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG = 'sqli-error-based';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labIdOrSlug: string) {
    return this.stateService.initializeState(userId, labIdOrSlug);
  }

  // ─── Get Step Progress ───────────────────────────────────────────────────────
  async getProgress(userId: string, labIdOrSlug: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const logs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId },
      select: { type: true },
    });
    const completedSteps = [...new Set(logs.map((l) => l.type))];
    return {
      completedSteps,
      currentStep: this.resolveCurrentStep(completedSteps),
      totalSteps: 3,
    };
  }

  async lookupUser(userId: string, labIdOrSlug: string, idParam: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const raw = idParam ?? '';

    // STEP 1: Basic CAST test with literal string
    if (/cast\s*\(\s*\(\s*select\s+'.+?'\s*\)\s+as\s+integer\s*\)/i.test(raw)) {
      await this.recordStep(userId, labId, 'STEP_1_CAST_CONFIRM');
      const match = raw.match(/select\s+'(.+?)'/);
      const leaked = match ? match[1] : 'data';
      return {
        success: false,
        error: `invalid input syntax for type integer: "${leaked}"`,
        stepCompleted: 'STEP_1_CAST_CONFIRM',
        feedback: 'Error reveals your injected value! Error-based injection confirmed.',
        ar_feedback: 'الخطأ يكشف قيمتك المحقونة! تأكّد الحقن القائم على الأخطاء.',
      };
    }

    // STEP 2: information_schema enumeration
    if (/information_schema/i.test(raw) && /cast/i.test(raw)) {
      await this.recordStep(userId, labId, 'STEP_2_ENUM_TABLES');
      return {
        success: false,
        error: 'invalid input syntax for type integer: "admin_keys"',
        stepCompleted: 'STEP_2_ENUM_TABLES',
        feedback: 'Table name leaked: admin_keys. Now query that table!',
        ar_feedback: 'تسريب اسم الجدول: admin_keys. الآن استعلم من ذلك الجدول!',
      };
    }

    // STEP 3: Extract api_key from admin_keys
    if (/admin_keys/i.test(raw) && /cast/i.test(raw)) {
      await this.recordStep(userId, labId, 'STEP_3_EXTRACT');
      const flag = this.stateService.generateDynamicFlag(
        `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
        userId,
        labId,
      );
      return {
        success: false,
        error: `invalid input syntax for type integer: "${flag}"`,
        stepCompleted: 'STEP_3_EXTRACT',
        exploited: true,
        flag,
        message: 'API key extracted via error message!',
        ar_message: 'تم استخراج مفتاح API عبر رسالة الخطأ!',
      };
    }

    // Normal lookup
    const numId = parseInt(raw);
    if (numId === 1) {
      return { success: true, user: { id: 1, username: 'johndoe', email: 'john@example.com', role: 'user' } };
    }
    if (isNaN(numId)) {
      return { success: false, error: `invalid input syntax for type integer: "${raw.slice(0, 30)}"` };
    }
    return { success: false, error: 'User not found' };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXTRACT')) return 3;
    if (completedSteps.includes('STEP_2_ENUM_TABLES')) return 3;
    if (completedSteps.includes('STEP_1_CAST_CONFIRM')) return 2;
    return 1;
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({ where: { userId, labId, type: stepType } });
    if (!exists) await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
  }
}
