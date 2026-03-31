// src/modules/practice-labs/sql-injection/labs/lab3/lab3.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG       = 'sqli-blind-boolean';
const ADMIN_PASSWORD = 'secr3t!X'; // 8 chars — students extract char by char

const ARTICLES = [
  {
    id: 1,
    title: 'Getting Started with Docker',
    content:
      'Docker lets you package applications and their dependencies into lightweight containers. ' +
      'Unlike virtual machines, containers share the host OS kernel, making them faster to start ' +
      'and far more resource-efficient. A single Dockerfile describes your environment, and ' +
      '`docker build` + `docker run` gets you from code to running service in seconds.',
  },
  {
    id: 2,
    title: 'TypeScript Generics Explained',
    content:
      'Generics let you write functions and classes that work over a variety of types while ' +
      'still enforcing type safety. Instead of using `any`, you parameterise the type: ' +
      '`function identity<T>(arg: T): T { return arg; }`. The compiler infers `T` at the ' +
      'call-site, catching type mismatches before runtime.',
  },
  {
    id: 3,
    title: 'PostgreSQL Query Optimisation',
    content:
      'Slow queries almost always come down to missing indexes or full sequential scans. ' +
      'Start with `EXPLAIN ANALYZE` to see exactly what the planner does. Add a B-tree index ' +
      'on high-cardinality filter columns, use partial indexes for sparse conditions, and ' +
      'keep statistics up-to-date with regular `ANALYZE` runs.',
  },
  {
    id: 4,
    title: 'Understanding JWT Authentication',
    content:
      'A JSON Web Token carries three Base64-encoded parts: header, payload, and signature. ' +
      'The server signs the payload with a secret key; any tampering invalidates the signature. ' +
      'Keep tokens short-lived, store them in memory rather than localStorage, and always ' +
      'validate the `alg` header — never accept `"alg": "none"`.',
  },
  {
    id: 5,
    title: 'CI/CD Pipelines with GitHub Actions',
    content:
      'GitHub Actions lets you define workflows as YAML files inside `.github/workflows/`. ' +
      'A workflow triggers on events like `push` or `pull_request`, spins up runners, and ' +
      'executes jobs in parallel or sequentially. Cache dependencies between runs to slash ' +
      'build times, and use environment secrets for anything sensitive.',
  },
];

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
    const logs  = await this.prisma.labGenericLog.findMany({
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
    // STEP 3 — ASCII character extraction
    // Match: 5 AND ASCII(SUBSTRING(...,pos,1))=ascii_val--
    // ──────────────────────────────────────────────────────────
    const asciiMatch = raw.match(
      /ascii\s*\(\s*substring\s*\(.*?,(\d+),\s*1\s*\)\s*\)\s*([><=!]+)\s*(\d+)/i,
    );
    if (asciiMatch) {
      const pos    = parseInt(asciiMatch[1]) - 1;   // 0-based
      const op     = asciiMatch[2];
      const tested = parseInt(asciiMatch[3]);
      const actual = pos >= 0 && pos < ADMIN_PASSWORD.length
        ? ADMIN_PASSWORD.charCodeAt(pos)
        : -1;
      const result = this.evalOp(actual, op, tested);

      // Only record on exact equality (=) so we track confirmed positions
      if (result && op === '=') {
        // Each position stored as a separate log entry with a unique type key
        await this.recordStepOnce(userId, labId, `STEP_3_POS_${pos}`);
        // Also mark the general step for progress display
        await this.recordStepOnce(userId, labId, 'STEP_3_EXTRACT');

        // Check how many unique positions have been confirmed
        const confirmed = await this.prisma.labGenericLog.count({
          where: { userId, labId, type: { startsWith: 'STEP_3_POS_' } },
        });

        if (confirmed >= ADMIN_PASSWORD.length) {
          await this.recordStepOnce(userId, labId, 'STEP_3_COMPLETE');
          const flag = this.stateService.generateDynamicFlag(
            `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
            userId,
            labId,
          );
          return {
            found:         true,
            stepCompleted: 'STEP_3_COMPLETE',
            exploited:     true,
            message:       `Password is "${ADMIN_PASSWORD}" — all characters extracted.`,
            flag,
          };
        }

        return { found: true, stepCompleted: 'STEP_3_EXTRACT' };
      }

      // Non-equality probes (> / <) just return the boolean, no step record
      return { found: result };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 2 — LENGTH probe
    // Match: 5 AND LENGTH(...)>7--
    // ──────────────────────────────────────────────────────────
    const lengthMatch = raw.match(/length\s*\(.*?\)\s*([><=!]+)\s*(\d+)/i);
    if (lengthMatch) {
      const op     = lengthMatch[1];
      const tested = parseInt(lengthMatch[2]);
      const result = this.evalOp(ADMIN_PASSWORD.length, op, tested);
      if (result) await this.recordStepOnce(userId, labId, 'STEP_2_LENGTH');
      return { found: result, stepCompleted: result ? 'STEP_2_LENGTH' : undefined };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 1 — Boolean oracle confirmation
    // Match: 5 AND 1=1-- or 5 AND 1=2--
    // ──────────────────────────────────────────────────────────
    const boolMatch = raw.match(/and\s+(\d+)\s*([><=!]+)\s*(\d+)/i);
    if (boolMatch) {
      const a      = parseInt(boolMatch[1]);
      const op     = boolMatch[2];
      const b      = parseInt(boolMatch[3]);
      const result = this.evalOp(a, op, b);
      await this.recordStepOnce(userId, labId, 'STEP_1_CONFIRM');
      if (result) {
        const article = ARTICLES.find((a) => a.id === 5)!;
        return { found: true, article, stepCompleted: 'STEP_1_CONFIRM' };
      }
      return { found: false, stepCompleted: 'STEP_1_CONFIRM' };
    }

    // ──────────────────────────────────────────────────────────
    // Plain article lookup by numeric id (1–5)
    // ──────────────────────────────────────────────────────────
    const numId   = parseInt(raw);
    const article = ARTICLES.find((a) => a.id === numId);
    if (article) return { found: true, article };
    return { found: false };
  }

  // ── helpers ──────────────────────────────────────────────────

  private evalOp(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>':              return a > b;
      case '<':              return a < b;
      case '>=':             return a >= b;
      case '<=':             return a <= b;
      case '=':              return a === b;
      case '!=': case '<>':  return a !== b;
      default:               return false;
    }
  }

  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.some((s) => s.startsWith('STEP_3'))) return 3;
    if (completedSteps.includes('STEP_2_LENGTH'))           return 3;
    if (completedSteps.includes('STEP_1_CONFIRM'))          return 2;
    return 1;
  }

  /** Insert a log row only if this (userId, labId, type) doesn't already exist */
  private async recordStepOnce(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({
      where: { userId, labId, type: stepType },
    });
    if (!exists) {
      await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
    }
  }
}
