// src/modules/practice-labs/sql-injection/labs/lab1/lab1.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─── Lab Steps ──────────────────────────────────────────────────────────────────
//
// اللاب 3 مراحل إلزامية، مينفعش توصل لـ flag من غير ما تمر بيها كلها:
//
// STEP 1 ─ PROBE      : يتحقق أن المستخدم جرب single quote ورأى الخطأ
// STEP 2 ─ CONFIRM    : يتحقق أنه جرب payload يكسر الاستعلام (OR 1=1 بدون توقف كامل)
// STEP 3 ─ EXPLOIT    : يكمل الـ payload ويدخل كأدمن
//
// كل خطوة تحفظ حالتها في LabGenericLog بـ event type
// الفرونت يستطلع progress من /lab1/progress

const LAB_SLUG = 'sqli-auth-bypass';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  // ─── Start Lab ──────────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    // ريست الـ progress log عند كل بداية جديدة
    await this.prisma.labGenericLog.deleteMany({ where: { userId, labId } });
    return result;
  }

  // ─── Get Step Progress ───────────────────────────────────────────────────────────
  async getProgress(userId: string, labId: string) {
    const logs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId },
      select: { event: true },
    });
    const completedSteps = logs.map((l) => l.event);
    return {
      completedSteps,
      currentStep: this.resolveCurrentStep(completedSteps),
      totalSteps: 3,
    };
  }

  // ─── Login (vulnerable endpoint) ─────────────────────────────────────────────
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
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
      dbError = true;
      // ─ STEP 1 PROBE: المستخدم وصل للكسر → يسجل الخطوة
      await this.recordStep(userId, labId, 'STEP_1_PROBE');
      return {
        success: false,
        exploited: false,
        step: 1,
        stepCompleted: 'STEP_1_PROBE',
        feedback: 'Something went wrong with your input. Interesting...',
        ar_feedback: 'حدث خطأ في مدخلاتك. مثير للاهتمام...',
        hint: 'The server reacted differently to your input. What does that tell you?',
      };
    }

    const user = users[0];

    if (!user) {
      // ─ هل المستخدم جرب injection pattern لكن لم يكمل بعد?
      const partialInjection = this.detectPartialInjection(username);
      if (partialInjection) {
        await this.recordStep(userId, labId, 'STEP_2_CONFIRM');
        return {
          success: false,
          exploited: false,
          step: 2,
          stepCompleted: 'STEP_2_CONFIRM',
          feedback:
            "You're on the right track. The query structure is becoming clear.",
          ar_feedback:
            'أنت في الطريق الصحيح. بنية الاستعلام تتضح شيئاً فشيئاً.',
          hint: 'Now make the WHERE clause always evaluate to true.',
        };
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // ─ تحقق من أن STEP 1 + 2 مكتملتين قبل STEP 3
    const progress = await this.getProgress(userId, labId);
    const hasStep1 = progress.completedSteps.includes('STEP_1_PROBE');
    const hasStep2 = progress.completedSteps.includes('STEP_2_CONFIRM');

    if (!hasStep1 || !hasStep2) {
      return {
        success: false,
        exploited: false,
        feedback:
          'You found a valid login, but you need to probe further first.',
        ar_feedback:
          'وجدت دخولاً صحيحاً، لكن عليك استكشاف المزيد أولاً.',
        hint: "Try breaking the query syntax first with a single quote '",
      };
    }

    // ─ STEP 3 EXPLOIT: المستخدم حصل على admin
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

    // ─ دخل كمستخدم عادي (non-admin)
    return {
      success: true,
      exploited: false,
      username: user.username,
      role: user.role,
      feedback: 'Logged in as a regular user. The admin account is the target.',
      ar_feedback:
        'تسجيل دخول كمستخدم عادي. حساب الأدمن هو الهدف.',
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────────────

  private async recordStep(userId: string, labId: string, event: string) {
    // سجل بس لو مكنتش مسجل قبلك
    const exists = await this.prisma.labGenericLog.findFirst({
      where: { userId, labId, event },
    });
    if (!exists) {
      await this.prisma.labGenericLog.create({
        data: { userId, labId, event },
      });
    }
  }

  private detectPartialInjection(username: string): boolean {
    // اكتشف OR/AND injection keywords بدون إكمال كامل
    const lc = username.toLowerCase();
    return (
      (lc.includes('or') || lc.includes('and')) &&
      (lc.includes("'") || lc.includes('--')) &&
      !lc.includes('1=1') &&
      !lc.includes('true')
    );
  }

  private resolveCurrentStep(completedSteps: string[]): number {
    if (completedSteps.includes('STEP_3_EXPLOIT')) return 3;
    if (completedSteps.includes('STEP_2_CONFIRM')) return 3;
    if (completedSteps.includes('STEP_1_PROBE')) return 2;
    return 1;
  }
}
