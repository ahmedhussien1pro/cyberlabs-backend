// src/modules/practice-labs/sql-injection/labs/lab1/lab1.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─── Step Events ────────────────────────────────────────────────────────────
// STEP_1_PROBE   : any input that breaks SQL syntax (single quote etc.)
// STEP_2_CONFIRM : any OR/AND based injection that manipulates WHERE logic
// STEP_3_EXPLOIT : full bypass → logged in as admin
const LAB_SLUG = 'sqli-auth-bypass';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  // ─── Start Lab ─────────────────────────────────────────────────────────────
  async initLab(userId: string, labIdOrSlug: string) {
    return this.stateService.initializeState(userId, labIdOrSlug);
  }

  // ─── Get Step Progress ──────────────────────────────────────────────────────
  async getProgress(userId: string, labIdOrSlug: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const logs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId },
      select: { type: true },
    });
    const completedSteps = logs.map((l) => l.type);
    return {
      completedSteps,
      currentStep: this.resolveCurrentStep(completedSteps),
      totalSteps: 3,
    };
  }

  // ─── Login (intentionally vulnerable) ──────────────────────────────────────
  async login(
    userId: string,
    labIdOrSlug: string,
    username: string,
    password: string,
  ) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);

    const query = `
      SELECT * FROM "LabGenericUser"
      WHERE  "userId"   = '${userId}'
      AND    "labId"    = '${labId}'
      AND    "username" = '${username}'
      AND    "password" = '${password}'
    `;

    let users: any[] = [];
    let dbError = false;

    try {
      users = (await this.prisma.$queryRawUnsafe(query)) as any[];
    } catch {
      // SQL syntax error → STEP_1_PROBE
      dbError = true;
      await this.recordStep(userId, labId, 'STEP_1_PROBE');
      return {
        success: false,
        exploited: false,
        step: 1,
        stepCompleted: 'STEP_1_PROBE',
        feedback: 'Something went wrong with your input. Interesting...',
        ar_feedback: 'حدث خطأ في مدخلاتك. مثير للاهتمام...',
        hint: 'The server reacted differently — the quote broke the SQL syntax. Now try to use this to your advantage.',
      };
    }

    const user = users[0];

    if (!user) {
      // No result — check if this is an injection attempt (STEP_2)
      if (this.detectInjectionAttempt(username)) {
        await this.recordStep(userId, labId, 'STEP_2_CONFIRM');
        return {
          success: false,
          exploited: false,
          step: 2,
          stepCompleted: 'STEP_2_CONFIRM',
          feedback: "You're manipulating the query structure — good. The WHERE condition isn't bypassed yet.",
          ar_feedback: 'أنت تتلاعب في بنية الاستعلام — جيد. لكن الشرط لم يُتجاوز بعد.',
          hint: "Add -- at the end to comment out the rest of the query. Example: admin' OR '1'='1' --",
        };
      }
      // Normal wrong credentials — return 200 with success: false (NOT 401)
      return {
        success: false,
        exploited: false,
        feedback: 'Invalid credentials.',
        ar_feedback: 'بيانات تسجيل الدخول غير صحيحة.',
      };
    }

    // Got a user result
    const progress = await this.getProgress(userId, labId);
    const hasStep1 = progress.completedSteps.includes('STEP_1_PROBE');
    const hasStep2 = progress.completedSteps.includes('STEP_2_CONFIRM');

    // Reached admin without going through the steps → guide them
    if (!hasStep1 || !hasStep2) {
      return {
        success: false,
        exploited: false,
        feedback: 'You found a valid login, but you need to probe further first.',
        ar_feedback: 'وجدت دخولاً صحيحاً، لكن عليك استكشاف المزيد أولاً.',
        hint: "Try breaking the query syntax first with a single quote '",
      };
    }

    if (user.role?.toLowerCase() === 'admin') {
      await this.recordStep(userId, labId, 'STEP_3_EXPLOIT');
      const flag = this.stateService.generateDynamicFlag(
        `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
        userId,
        labId,
      );
      return {
        success: true,
        exploited: true,
        step: 3,
        stepCompleted: 'STEP_3_EXPLOIT',
        username: user.username,
        role: user.role,
        flag,
        message: 'SQL Injection successful! Logged in as admin.',
        ar_message: 'حقن SQL ناجح! تم تسجيل الدخول كأدمن.',
      };
    }

    return {
      success: true,
      exploited: false,
      username: user.username,
      role: user.role,
      feedback: 'Logged in as a regular user. The admin account is the target.',
      ar_feedback: 'تسجيل دخول كمستخدم عادي. حساب الأدمن هو الهدف.',
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Detects any OR/AND based SQL injection attempt.
   * Flexible — accepts any variation, not a fixed payload.
   * Examples that pass: admin' OR 1=1 --, ' OR 'x'='x, admin' OR true --
   */
  private detectInjectionAttempt(username: string): boolean {
    const lc = username.toLowerCase().trim();
    const hasLogicalOp = /\bor\b|\band\b/.test(lc);
    const hasSqlSyntax = lc.includes("'") || lc.includes('--') || lc.includes('#');
    return hasLogicalOp && hasSqlSyntax;
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({
      where: { userId, labId, type: stepType },
    });
    if (!exists) {
      await this.prisma.labGenericLog.create({
        data: { userId, labId, type: stepType },
      });
    }
  }

  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXPLOIT')) return 3;
    if (completedSteps.includes('STEP_2_CONFIRM')) return 3;
    if (completedSteps.includes('STEP_1_PROBE')) return 2;
    return 1;
  }
}
