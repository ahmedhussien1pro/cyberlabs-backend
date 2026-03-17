// src/modules/practice-labs/sql-injection/labs/lab1/lab1.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─── Step Events ─────────────────────────────────────────────────────────────
// STEP_1_PROBE   : any input that breaks SQL syntax (single quote etc.)
// STEP_2_CONFIRM : OR/AND injection that manipulates WHERE but returns empty
// STEP_3_EXPLOIT : full bypass → logged in as admin
const LAB_SLUG = 'sqli-auth-bypass';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  // ─── Start Lab ───────────────────────────────────────────────────────────────
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
    const completedSteps = logs.map((l) => l.type);
    return {
      completedSteps,
      currentStep: this.resolveCurrentStep(completedSteps),
      totalSteps: 3,
    };
  }

  // ─── Login (intentionally vulnerable) ───────────────────────────────────────
  async login(
    userId: string,
    labIdOrSlug: string,
    username: string,
    password: string,
  ) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);

    // Intentionally vulnerable raw query — DO NOT sanitize
    const query = `
      SELECT * FROM "LabGenericUser"
      WHERE  "userId"   = '${userId}'
      AND    "labId"    = '${labId}'
      AND    "username" = '${username}'
      AND    "password" = '${password}'
    `;

    let users: any[] = [];

    try {
      users = (await this.prisma.$queryRawUnsafe(query)) as any[];
    } catch {
      // ── SQL syntax error → STEP_1_PROBE ──────────────────────────────────
      await this.recordStep(userId, labId, 'STEP_1_PROBE');
      return {
        success: false,
        exploited: false,
        step: 1,
        stepCompleted: 'STEP_1_PROBE',
        feedback: 'Something went wrong with your input. Interesting...',
        ar_feedback: 'حدث خطأ في مدخلاتك. مثير للاهتمام...',
        hint: "The server reacted differently — the quote broke the SQL syntax. Now try to use this to your advantage with OR.",
      };
    }

    const user = users.find((u) => u.role?.toLowerCase() === 'admin') ?? users[0];

    if (!user) {
      // ── Query ran fine but returned no rows ──────────────────────────────
      if (this.detectInjectionAttempt(username)) {
        // User is manipulating the WHERE clause but condition is false (e.g. OR 'x'='y')
        await this.recordStep(userId, labId, 'STEP_2_CONFIRM');
        return {
          success: false,
          exploited: false,
          step: 2,
          stepCompleted: 'STEP_2_CONFIRM',
          feedback: "You're manipulating the query structure — good. The WHERE condition isn't bypassed yet.",
          ar_feedback: 'أنت تتلاعب في بنية الاستعلام — جيد. لكن الشرط لم يُتجاوز بعد.',
          hint: "Make the OR condition always true. Try: admin' OR '1'='1' --",
        };
      }
      // Normal wrong credentials
      return {
        success: false,
        exploited: false,
        feedback: 'Invalid credentials.',
        ar_feedback: 'بيانات تسجيل الدخول غير صحيحة.',
      };
    }

    // ── Query returned rows → bypass succeeded ───────────────────────────────
    // Auto-record any missing earlier steps so progress stays consistent
    await this.recordStep(userId, labId, 'STEP_1_PROBE');
    await this.recordStep(userId, labId, 'STEP_2_CONFIRM');

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

    // Logged in as a regular user (valid credentials, not admin)
    return {
      success: true,
      exploited: false,
      username: user.username,
      role: user.role,
      feedback: 'Logged in as a regular user. The admin account is the target.',
      ar_feedback: 'تسجيل دخول كمستخدم عادي. حساب الأدمن هو الهدف.',
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Detects OR/AND based SQL injection in the username field.
   * Matches: admin' OR '1'='1' --, ' OR 1=1 --, admin' OR true --
   * Does NOT match normal wrong credentials.
   */
  private detectInjectionAttempt(username: string): boolean {
    const lc = username.toLowerCase().trim();
    const hasLogicalOp = /\bor\b|\band\b/.test(lc);
    const hasSqlSyntax =
      lc.includes("'") || lc.includes('--') || lc.includes('#');
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
