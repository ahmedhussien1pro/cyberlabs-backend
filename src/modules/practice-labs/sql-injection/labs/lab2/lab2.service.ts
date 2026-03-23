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

  async search(userId: string, labIdOrSlug: string, query: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const lq = query.toLowerCase();

    // Detect ORDER BY enumeration → STEP_1_COLUMN_COUNT
    if (/order\s+by\s+\d/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_1_COLUMN_COUNT');
      const match = query.match(/order\s+by\s+(\d+)/i);
      const num = match ? parseInt(match[1]) : 0;
      if (num > 3) {
        return {
          success: false,
          error: 'ORDER BY position out of range — 1 column too many',
          stepCompleted: 'STEP_1_COLUMN_COUNT',
          feedback: 'Error at ORDER BY 4 means the query has exactly 3 columns!',
          ar_feedback: 'الخطأ عند ORDER BY 4 يعني الاستعلام يحتوي على 3 أعمدة تحديداً!',
        };
      }
      return {
        success: true,
        results: [],
        stepCompleted: 'STEP_1_COLUMN_COUNT',
        feedback: `ORDER BY ${num} works — keep going up until it breaks.`,
        ar_feedback: `ORDER BY ${num} يعمل — استمر في الزيادة حتى يحدث خطأ.`,
      };
    }

    // Detect UNION + string test → STEP_2_STRING_COLUMN
    if (/union\s+select/i.test(query) && /null|'test'/i.test(query) && !/secrets/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_2_STRING_COLUMN');
      const hasStringInCol2 = /'test'.*null\s*--|null.*'test'.*null/i.test(query.replace(/\s+/g, ' '));
      return {
        success: true,
        results: hasStringInCol2 ? [{ id: null, name: 'test', price: null }] : [],
        stepCompleted: 'STEP_2_STRING_COLUMN',
        feedback: hasStringInCol2
          ? "String appeared in column 2! That's your extraction column."
          : 'Try replacing each NULL one at a time with a string value.',
        ar_feedback: hasStringInCol2
          ? 'ظهر النص في العمود 2! هذا هو عمود الاستخراج.'
          : 'جرّب استبدال كل NULL واحداً بواحد بقيمة نصية.',
      };
    }

    // Detect UNION SELECT from secrets → STEP_3_EXTRACT
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
        exploited: true,
        flag,
        message: 'UNION injection successful! Secret data extracted.',
        ar_message: 'حقن UNION ناجح! تم استخراج البيانات السرية.',
      };
    }

    // Syntax error (unmatched quote)
    if ((query.match(/'/g) || []).length % 2 !== 0 && !/--/.test(query)) {
      return {
        success: false,
        error: 'syntax error at or near "\'"',
        feedback: 'SQL syntax broken — you\'re injecting! Add -- to comment out the rest.',
        ar_feedback: 'قواعد SQL مكسورة — أنت تحقن! أضف -- لتعليق الباقي.',
      };
    }

    // Normal search simulation
    const products = [
      { id: 1, name: 'Laptop Pro', price: 999 },
      { id: 2, name: 'Wireless Mouse', price: 29 },
      { id: 3, name: 'Mechanical Keyboard', price: 89 },
    ];
    const results = products.filter((p) =>
      p.name.toLowerCase().includes(lq.replace(/[^a-z0-9 ]/g, '')),
    );
    return { success: true, results };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXTRACT')) return 3;
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
