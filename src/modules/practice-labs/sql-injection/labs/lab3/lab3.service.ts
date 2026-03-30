// src/modules/practice-labs/sql-injection/labs/lab3/lab3.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG       = 'sqli-blind-boolean';
const ADMIN_PASSWORD = 'secr3t!X'; // 8 chars

@Injectable()
export class Lab3Service {
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

  async getArticle(userId: string, labIdOrSlug: string, idParam: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const raw   = (idParam ?? '').trim();

    // ──────────────────────────────────────────────────────────
    // STEP 3 — ASCII(SUBSTRING(…)) character extraction
    // ──────────────────────────────────────────────────────────
    const asciiMatch = raw.match(
      /ascii\s*\(\s*substring\s*\(.*?,(\d+),\s*1\s*\)\s*\)\s*([><=!]+)\s*(\d+)/i,
    );
    if (asciiMatch) {
      const pos    = parseInt(asciiMatch[1]) - 1; // 0-indexed
      const op     = asciiMatch[2];
      const tested = parseInt(asciiMatch[3]);
      const actual = pos < ADMIN_PASSWORD.length ? ADMIN_PASSWORD.charCodeAt(pos) : -1;
      const result = this.evalOp(actual, op, tested);

      if (result) await this.recordStep(userId, labId, 'STEP_3_EXTRACT');

      // Check if the full password has been brute-forced (exact equality hits for every position)
      const exactHit = op === '=' && actual === tested;
      if (exactHit) {
        const logs = await this.prisma.labGenericLog.findMany({
          where: { userId, labId, type: 'STEP_3_EXTRACT' },
        });
        if (logs.length >= ADMIN_PASSWORD.length) {
          await this.recordStep(userId, labId, 'STEP_3_COMPLETE');
          const flag = this.stateService.generateDynamicFlag(
            `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
            userId,
            labId,
          );
          return { found: true, stepCompleted: 'STEP_3_COMPLETE', exploited: true, flag };
        }
      }

      return { found: result, stepCompleted: result ? 'STEP_3_EXTRACT' : undefined };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 2 — LENGTH / generic numeric probe
    // ──────────────────────────────────────────────────────────
    const lengthMatch = raw.match(
      /length\s*\(.*?\)\s*([><=!]+)\s*(\d+)/i,
    );
    if (lengthMatch) {
      const op     = lengthMatch[1];
      const tested = parseInt(lengthMatch[2]);
      const result = this.evalOp(ADMIN_PASSWORD.length, op, tested);
      if (result) await this.recordStep(userId, labId, 'STEP_2_LENGTH');
      return { found: result, stepCompleted: result ? 'STEP_2_LENGTH' : undefined };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 1 — Boolean oracle confirmation (AND 1=1 / AND 1=2 / AND 1>0 etc.)
    // ──────────────────────────────────────────────────────────
    const boolMatch = raw.match(/and\s+(\d+)\s*([><=!]+)\s*(\d+)/i);
    if (boolMatch) {
      const a      = parseInt(boolMatch[1]);
      const op     = boolMatch[2];
      const b      = parseInt(boolMatch[3]);
      const result = this.evalOp(a, op, b);
      await this.recordStep(userId, labId, 'STEP_1_CONFIRM');
      if (result) {
        return {
          found: true,
          article: { id: 5, title: 'Getting Started with Docker', content: 'Docker lets you ship applications in containers...' },
          stepCompleted: 'STEP_1_CONFIRM',
        };
      }
      return { found: false, stepCompleted: 'STEP_1_CONFIRM' };
    }

    // ──────────────────────────────────────────────────────────
    // Plain article lookup
    // ──────────────────────────────────────────────────────────
    const numId = parseInt(raw);
    if (numId === 5) {
      return {
        found:   true,
        article: { id: 5, title: 'Getting Started with Docker', content: 'Docker lets you ship applications in containers...' },
      };
    }
    return { found: false };
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private evalOp(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>':  return a > b;
      case '<':  return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '=':  return a === b;
      case '!=': case '<>': return a !== b;
      default:   return false;
    }
  }

  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_COMPLETE') ||
        completedSteps.includes('STEP_3_EXTRACT'))  return 3;
    if (completedSteps.includes('STEP_2_LENGTH'))    return 3;
    if (completedSteps.includes('STEP_1_CONFIRM'))   return 2;
    return 1;
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({ where: { userId, labId, type: stepType } });
    if (!exists) await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
  }
}
