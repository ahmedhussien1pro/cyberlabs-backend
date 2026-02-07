import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as Handlebars from 'handlebars';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: SSTI - User input في Template بدون Sanitization
  async renderGreeting(userId: string, labId: string, name: string) {
    try {
      // ❌ الثغرة: استخدام user input مباشرة في template
      const template = `Hello {{name}}! Welcome to the system.`;

      // جلب كل الـ contents (بما فيها السرية!)
      const contents = await this.prisma.labGenericContent.findMany({
        where: { userId, labId },
      });

      const compile = Handlebars.compile(template);
      const result = compile({
        name,
        contents, // ❌ الثغرة: تمرير بيانات حساسة للـ context
        secret: 'FLAG{SSTI_TEMPLATE_INJECTION_BASIC}',
      });

      // التحقق من الاستغلال
      if (
        name.includes('{{') ||
        name.includes('secret') ||
        name.includes('contents')
      ) {
        return {
          result,
          exploited: true,
          message: 'SSTI vulnerability exploited!',
        };
      }

      return { result };
    } catch (error) {
      return { error: 'Template rendering failed', details: error.message };
    }
  }
}
