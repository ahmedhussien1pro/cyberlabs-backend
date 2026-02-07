import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as Handlebars from 'handlebars';

@Injectable()
export class Lab3Service {
  private readonly BLOCKED_KEYWORDS = ['{{', '}}', 'eval', 'exec'];

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Weak Filter يمكن تجاوزه
  private sanitize(input: string): string {
    let sanitized = input;

    // ❌ الفلتر ضعيف: يمكن تجاوزه بـ encoding أو concatenation
    this.BLOCKED_KEYWORDS.forEach((keyword) => {
      sanitized = sanitized.replace(keyword, '');
    });

    return sanitized;
  }

  async renderWithFilter(userId: string, labId: string, userInput: string) {
    try {
      // محاولة تطبيق فلتر
      const sanitized = this.sanitize(userInput);

      // ❌ الثغرة: الفلتر يمكن تجاوزه بطرق مختلفة
      const template = `User input: ${sanitized}`;
      const compile = Handlebars.compile(template);

      const result = compile({
        secret: 'FLAG{SSTI_FILTER_BYPASSED}',
        data: 'sensitive information',
      });

      // التحقق من نجاح الـ Bypass
      if (
        userInput !== sanitized ||
        userInput.includes('{') ||
        result.includes('FLAG')
      ) {
        return {
          result,
          exploited: true,
          flag: 'FLAG{SSTI_FILTER_BYPASSED}',
          message: 'Filter bypass successful!',
        };
      }

      return { result };
    } catch (error) {
      return { error: 'Rendering failed', details: error.message };
    }
  }
}
