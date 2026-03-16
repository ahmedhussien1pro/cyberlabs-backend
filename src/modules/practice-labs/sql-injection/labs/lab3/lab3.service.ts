import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const LAB_SLUG = 'sqli-blind-boolean';
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

  async getArticle(userId: string, labIdOrSlug: string, idParam: string) {
    const labId = await this.stateService.resolveLabId(labIdOrSlug);
    const raw = idParam ?? '';

    // Confirm boolean injection: AND 1=1 or AND 1=2
    if (/and\s+1\s*=\s*[12]/i.test(raw)) {
      await this.recordStep(userId, labId, 'STEP_1_CONFIRM');
      const isTrue = /and\s+1\s*=\s*1/i.test(raw);
      if (isTrue) {
        return {
          found: true,
          article: { id: 5, title: 'Getting Started with Node.js', content: 'Node.js is a JavaScript runtime...' },
          stepCompleted: 'STEP_1_CONFIRM',
          feedback: 'TRUE condition → article found. Injection confirmed!',
          ar_feedback: 'الشرط صحيح → المقالة موجودة. تأكّد الحقن!',
        };
      }
      return {
        found: false,
        stepCompleted: 'STEP_1_CONFIRM',
        feedback: 'FALSE condition → article not found. Injection confirmed!',
        ar_feedback: 'الشرط خاطئ → المقالة غير موجودة. تأكّد الحقن!',
      };
    }

    // Length enumeration
    const lengthMatch = raw.match(/length\s*\(.*?\)\s*=\s*(\d+)/i);
    if (lengthMatch) {
      await this.recordStep(userId, labId, 'STEP_2_LENGTH');
      const guessed = parseInt(lengthMatch[1]);
      const correct = guessed === ADMIN_PASSWORD.length;
      return {
        found: correct,
        stepCompleted: correct ? 'STEP_2_LENGTH' : undefined,
        feedback: correct
          ? `Length = ${ADMIN_PASSWORD.length} ✓ Now extract each character!`
          : `Length ${guessed} is wrong. Keep trying.`,
        ar_feedback: correct
          ? `الطول = ${ADMIN_PASSWORD.length} ✓ الآن استخرج كل حرف!`
          : `الطول ${guessed} غير صحيح. استمر في المحاولة.`,
      };
    }

    // ASCII character extraction
    const asciiMatch = raw.match(/ascii\s*\(\s*substring\s*\(.*?,(\d+),\s*1\s*\)\s*\)\s*=\s*(\d+)/i);
    if (asciiMatch) {
      await this.recordStep(userId, labId, 'STEP_3_EXTRACT');
      const pos = parseInt(asciiMatch[1]) - 1;
      const ascii = parseInt(asciiMatch[2]);
      const correct = pos < ADMIN_PASSWORD.length && ADMIN_PASSWORD.charCodeAt(pos) === ascii;

      // All chars extracted?
      const logs = await this.prisma.labGenericLog.findMany({
        where: { userId, labId, type: 'STEP_3_EXTRACT' },
      });

      if (correct && logs.length >= ADMIN_PASSWORD.length) {
        const flag = this.stateService.generateDynamicFlag(
          `FLAG{${LAB_SLUG.toUpperCase().replace(/-/g, '_')}`,
          userId, labId,
        );
        return {
          found: true,
          stepCompleted: 'STEP_3_EXTRACT',
          exploited: true,
          flag,
          message: `Full password extracted: ${ADMIN_PASSWORD}`,
          ar_message: `تم استخراج كلمة المرور الكاملة: ${ADMIN_PASSWORD}`,
        };
      }

      return {
        found: correct,
        stepCompleted: correct ? 'STEP_3_EXTRACT' : undefined,
        feedback: correct
          ? `Position ${pos + 1} = '${ADMIN_PASSWORD[pos]}' ✓`
          : `Wrong ASCII at position ${pos + 1}`,
        ar_feedback: correct
          ? `الموضع ${pos + 1} = '${ADMIN_PASSWORD[pos]}' ✓`
          : `ASCII خاطئ في الموضع ${pos + 1}`,
      };
    }

    // Normal article lookup
    const numId = parseInt(raw);
    if (numId === 5) {
      return { found: true, article: { id: 5, title: 'Getting Started with Node.js', content: 'Node.js is a JavaScript runtime...' } };
    }
    return { found: false };
  }

  private async recordStep(userId: string, labId: string, stepType: string) {
    const exists = await this.prisma.labGenericLog.findFirst({ where: { userId, labId, type: stepType } });
    if (!exists) await this.prisma.labGenericLog.create({ data: { userId, labId, type: stepType } });
  }
}
