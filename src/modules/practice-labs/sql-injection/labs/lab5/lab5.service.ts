import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG = 'sqli-time-based';
const SECRET_TOKEN = 'FLAG{SQLI_TIME_BASED_SUCCESS}';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labIdOrSlug: string) {
    return this.stateService.initializeState(userId, labIdOrSlug);
  }

  async lookupAccount(userId: string, labIdOrSlug: string, accountParam: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const raw = accountParam ?? '';

    // STEP 1: CASE WHEN 1=1 THEN pg_sleep — basic confirmation
    if (/case\s+when\s+1\s*=\s*[12]\s+then\s+pg_sleep/i.test(raw)) {
      await this.recordStep(userId, labId, 'STEP_1_TIMING_CONFIRM');
      const isTrue = /when\s+1\s*=\s*1/i.test(raw);
      return {
        // Same 200 body always — timing is the only channel
        success: true,
        delayed: isTrue,
        responseTimeMs: isTrue ? 3012 : 45, // simulated
        stepCompleted: 'STEP_1_TIMING_CONFIRM',
        feedback: isTrue
          ? '3s delay! Time-based injection confirmed — TRUE condition sleeps.'
          : 'Instant response — FALSE condition confirmed.',
        ar_feedback: isTrue
          ? 'تأخير 3 ثوانٍ! تأكّد الحقن القائم على الوقت — الشرط الصحيح ينام.'
          : 'استجابة فورية — تأكّد الشرط الخاطئ.',
      };
    }

    // STEP 2: LENGTH enumeration of secret_token
    const lengthMatch = raw.match(/length\s*\(\s*\(\s*select\s+secret_token.*?\)\s*\)\s*\)\s*=\s*(\d+)/i);
    if (lengthMatch || (/length/i.test(raw) && /admin_tokens/i.test(raw))) {
      await this.recordStep(userId, labId, 'STEP_2_LENGTH');
      const guessed = lengthMatch ? parseInt(lengthMatch[1]) : 0;
      const correct = guessed === SECRET_TOKEN.length;
      return {
        success: true,
        delayed: correct,
        responseTimeMs: correct ? 3008 : 42,
        stepCompleted: correct ? 'STEP_2_LENGTH' : undefined,
        feedback: correct
          ? `3s delay! Token length = ${SECRET_TOKEN.length}`
          : `No delay — length ${guessed} is wrong. Try ${SECRET_TOKEN.length}.`,
        ar_feedback: correct
          ? `تأخير 3 ثوانٍ! طول الرمز = ${SECRET_TOKEN.length}`
          : `لا تأخير — الطول ${guessed} خاطئ.`,
      };
    }

    // STEP 3: ASCII character extraction from admin_tokens
    const asciiMatch = raw.match(/ascii\s*\(\s*substring\s*\(.*?,(\d+),\s*1\s*\)\s*\)\s*\)\s*=\s*(\d+)/i);
    if (asciiMatch || (/ascii/i.test(raw) && /admin_tokens/i.test(raw))) {
      await this.recordStep(userId, labId, 'STEP_3_EXTRACT');
      const pos = asciiMatch ? parseInt(asciiMatch[1]) - 1 : 0;
      const ascii = asciiMatch ? parseInt(asciiMatch[2]) : 0;
      const correct = pos < SECRET_TOKEN.length && SECRET_TOKEN.charCodeAt(pos) === ascii;

      const logs = await this.prisma.labGenericLog.findMany({
        where: { userId, labId, type: 'STEP_3_EXTRACT' },
      });

      if (correct && logs.length >= SECRET_TOKEN.length) {
        const flag = this.stateService.generateDynamicFlag(
          `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
          userId, labId,
        );
        return {
          success: true,
          delayed: true,
          responseTimeMs: 3005,
          stepCompleted: 'STEP_3_EXTRACT',
          exploited: true,
          flag,
          message: `Full token extracted: ${SECRET_TOKEN}`,
          ar_message: `تم استخراج الرمز الكامل: ${SECRET_TOKEN}`,
        };
      }

      return {
        success: true,
        delayed: correct,
        responseTimeMs: correct ? 3006 : 41,
        stepCompleted: correct ? 'STEP_3_EXTRACT' : undefined,
        feedback: correct
          ? `3s delay! Position ${pos + 1} = '${SECRET_TOKEN[pos]}'`
          : `No delay — wrong ASCII at position ${pos + 1}`,
        ar_feedback: correct
          ? `تأخير 3 ثوانٍ! الموضع ${pos + 1} = '${SECRET_TOKEN[pos]}'`
          : `لا تأخير — ASCII خاطئ في الموضع ${pos + 1}`,
      };
    }

    // Normal lookup — always same response (no oracle)
    return { success: true, message: 'Account lookup processed.' };
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({ where: { userId, labId, type: stepType } });
    if (!exists) await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
  }
}
