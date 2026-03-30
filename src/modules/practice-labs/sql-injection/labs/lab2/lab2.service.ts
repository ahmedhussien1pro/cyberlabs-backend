// src/modules/practice-labs/sql-injection/labs/lab2/lab2.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG = 'sqli-union-extract';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labIdOrSlug: string) {
    return this.stateService.initializeState(userId, labIdOrSlug);
  }

  // ── Reset: wipe all step logs for this user+lab ───────────────────────────
  async resetLab(userId: string, labIdOrSlug: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    await this.prisma.labGenericLog.deleteMany({ where: { userId, labId } });
    return { success: true, message: 'Lab progress reset.' };
  }

  // ── Get Step Progress ───────────────────────────────────────────────
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

  async search(userId: string, labIdOrSlug: string, query: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);

    // ── STEP 1: ORDER BY enumeration
    // Only complete the step when ORDER BY causes an error (num > 3),
    // meaning the student proved there are exactly 3 columns.
    if (/order\s+by\s+\d/i.test(query)) {
      const match = query.match(/order\s+by\s+(\d+)/i);
      const num = match ? parseInt(match[1]) : 0;

      if (num > 3) {
        // ✔ Step complete: student discovered column count
        await this.recordStep(userId, labId, 'STEP_1_COLUMN_COUNT');
        return {
          success: false,
          error: `ORDER BY ${num} — column out of range`,
          stepCompleted: 'STEP_1_COLUMN_COUNT',
          step: 1,
          feedback: `Error at ORDER BY ${num} — the query has exactly ${num - 1} columns. Now use UNION SELECT with ${num - 1} values.`,
          ar_feedback: `خطأ عند ORDER BY ${num} — الاستعلام يحتوي على ${num - 1} أعمدة. استخدم UNION SELECT مع ${num - 1} قيمة.`,
        };
      }

      // Still probing — no step logged yet
      return {
        success: true,
        results: [],
        feedback: `ORDER BY ${num} works — try a higher number until it breaks.`,
        ar_feedback: `ORDER BY ${num} يعمل — جرّب رقماً أكبر حتى يحدث خطأ.`,
      };
    }

    // ── STEP 2: UNION SELECT + find string column
    if (/union\s+select/i.test(query) && /null|'[^']+'/i.test(query) && !/secrets/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_2_STRING_COLUMN');
      const normalized = query.replace(/\s+/g, ' ').toLowerCase();
      // Column 2 is the visible one: pattern is <anything>, 'test', <anything>
      const hasStringInCol2 = /null\s*,\s*'[^']+'\s*,\s*(null|\d)/i.test(normalized);
      return {
        success: true,
        results: hasStringInCol2 ? [{ id: null, name: 'test', price: null }] : [],
        stepCompleted: 'STEP_2_STRING_COLUMN',
        step: 2,
        feedback: hasStringInCol2
          ? "String appeared in column 2 — that's your extraction column!"
          : 'Try replacing each NULL with a string one at a time to find the visible column.',
        ar_feedback: hasStringInCol2
          ? 'ظهر النص في العمود 2 — هذا هو عمود الاستخراج!'
          : 'جرّب استبدال كل NULL بقيمة نصية واحدةً لإيجاد العمود الظاهر.',
      };
    }

    // ── STEP 3: UNION SELECT from secrets table
    if (/union\s+select/i.test(query) && /secrets/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_3_EXTRACT');
      const flag = this.stateService.generateDynamicFlag(
        `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
        userId,
        labId,
      );
      return {
        success: true,
        results: [{ id: null, name: flag, price: null }],
        stepCompleted: 'STEP_3_EXTRACT',
        step: 3,
        exploited: true,
        flag,
        message: 'UNION injection successful! Secret data extracted.',
        ar_message: 'حقن UNION ناجح! تم استخراج البيانات السرية.',
      };
    }

    // ── Syntax error (unmatched quote without comment)
    if ((query.match(/'/g) || []).length % 2 !== 0 && !/--/.test(query)) {
      return {
        success: false,
        error: 'syntax error at or near "\'"',
        feedback: 'SQL syntax broken — you\'re injecting! Add -- to comment out the rest.',
        ar_feedback: 'قواعد SQL مكسورة — أنت تحقن! أضف -- لتعليق الباقي.',
      };
    }

    // ── Normal search
    const lq = query.toLowerCase();
    const products = [
      { id: 1, name: 'Laptop Pro',          price: 999 },
      { id: 2, name: 'Wireless Mouse',      price: 29  },
      { id: 3, name: 'Mechanical Keyboard', price: 89  },
    ];
    return {
      success: true,
      results: products.filter((p) => p.name.toLowerCase().includes(lq.replace(/[^a-z0-9 ]/g, ''))),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXTRACT'))      return 3;
    if (completedSteps.includes('STEP_2_STRING_COLUMN')) return 3;
    if (completedSteps.includes('STEP_1_COLUMN_COUNT')) return 2;
    return 1;
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({
      where: { userId, labId, type: stepType },
    });
    if (!exists) {
      await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
    }
  }
}
