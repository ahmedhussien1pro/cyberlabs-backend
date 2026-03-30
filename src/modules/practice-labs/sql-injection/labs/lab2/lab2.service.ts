// src/modules/practice-labs/sql-injection/labs/lab2/lab2.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG = 'sqli-union-extract';

const PRODUCTS = [
  { id: 1, name: 'Laptop Pro',          price: 999 },
  { id: 2, name: 'Wireless Mouse',      price: 29  },
  { id: 3, name: 'Mechanical Keyboard', price: 89  },
];

/** True when the input looks like an injection attempt (not a plain search) */
function looksLikeInjection(q: string): boolean {
  return /order\s+by|union\s+select|select\s+|insert\s+|drop\s+|--|\'|information_schema/i.test(q);
}

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labIdOrSlug: string) {
    return this.stateService.initializeState(userId, labIdOrSlug);
  }

  async resetLab(userId: string, labIdOrSlug: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    await this.prisma.labGenericLog.deleteMany({ where: { userId, labId } });
    return { success: true, message: 'Lab progress reset.' };
  }

  async getProgress(userId: string, labIdOrSlug: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const logs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId },
      select: { type: true },
    });
    const completedSteps = [...new Set(logs.map((l) => l.type))];
    return { completedSteps, currentStep: this.resolveCurrentStep(completedSteps), totalSteps: 3 };
  }

  async search(userId: string, labIdOrSlug: string, query: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);

    // ───────────────────────────────────────────────────────────
    // STEP 3 — UNION SELECT … FROM secrets  (check before step 2)
    // ───────────────────────────────────────────────────────────
    if (/union\s+select/i.test(query) && /secrets/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_3_EXTRACT');
      const flag = this.stateService.generateDynamicFlag(
        `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
        userId,
        labId,
      );
      return {
        success:       true,
        results:       [{ id: null, name: flag, price: null }],
        stepCompleted: 'STEP_3_EXTRACT',
        step:          3,
        exploited:     true,
        flag,
        message:       'UNION injection successful! Secret data extracted.',
      };
    }

    // ───────────────────────────────────────────────────────────
    // STEP 2 — UNION SELECT … NULL / string probing
    // ───────────────────────────────────────────────────────────
    if (/union\s+select/i.test(query)) {
      await this.recordStep(userId, labId, 'STEP_2_STRING_COLUMN');
      const norm = query.replace(/\s+/g, ' ').toLowerCase();
      // Check if the 2nd positional value is a quoted string (col 2 = name)
      const col2IsString = /union\s+select\s+(null|\d+)\s*,\s*'[^']*'\s*,/i.test(norm);
      return {
        success:       true,
        results:       col2IsString ? [{ id: null, name: 'test', price: null }] : [],
        stepCompleted: 'STEP_2_STRING_COLUMN',
        step:          2,
        feedback:      col2IsString
          ? "Column 2 reflects text — that's your extraction point."
          : 'Adjust your UNION SELECT column positions.',
      };
    }

    // ───────────────────────────────────────────────────────────
    // STEP 1 — ORDER BY column count enumeration
    // ───────────────────────────────────────────────────────────
    if (/order\s+by/i.test(query)) {
      const match = query.match(/order\s+by\s+(\d+)/i);

      // ORDER BY without a number — incomplete / typo
      if (!match) {
        return {
          success:  false,
          error:    'syntax error: ORDER BY requires a column number',
          feedback: 'Add a number after ORDER BY, e.g. ORDER BY 1 --',
        };
      }

      const num = parseInt(match[1]);

      if (num > 3) {
        // ✔ Column count confirmed
        await this.recordStep(userId, labId, 'STEP_1_COLUMN_COUNT');
        return {
          success:       false,
          error:         `ORDER BY ${num} — Unknown column`,
          stepCompleted: 'STEP_1_COLUMN_COUNT',
          step:          1,
          feedback:      `Error at ORDER BY ${num} — the table has exactly ${num - 1} columns.`,
        };
      }

      // num ≤ 3: still valid, keep probing
      return {
        success:  true,
        results:  PRODUCTS, // real rows returned — ORDER BY doesn’t break the query
        feedback: `ORDER BY ${num} — query still works. Try a higher number.`,
      };
    }

    // ───────────────────────────────────────────────────────────
    // Unmatched quote — syntax error feedback
    // ───────────────────────────────────────────────────────────
    if ((query.match(/'/g) || []).length % 2 !== 0) {
      return {
        success:  false,
        error:    'syntax error at or near "\'"',
        feedback: 'Unmatched quote — the query broke. Add -- to close it.',
      };
    }

    // ───────────────────────────────────────────────────────────
    // Any other injection keyword that slipped through — generic SQL error
    // ───────────────────────────────────────────────────────────
    if (looksLikeInjection(query)) {
      return {
        success:  false,
        error:    'syntax error near unexpected token',
        feedback: 'SQL error detected.',
      };
    }

    // ───────────────────────────────────────────────────────────
    // Normal product search
    // ───────────────────────────────────────────────────────────
    const lq = query.toLowerCase().trim();
    return {
      success: true,
      results: lq
        ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(lq))
        : PRODUCTS,
    };
  }

  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXTRACT'))       return 3;
    if (completedSteps.includes('STEP_2_STRING_COLUMN'))  return 3;
    if (completedSteps.includes('STEP_1_COLUMN_COUNT'))   return 2;
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
