import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as Handlebars from 'handlebars';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {
    // ❌ الثغرة: تسجيل Helper خطير
    Handlebars.registerHelper('exec', function (command) {
      // Simulated RCE - في الواقع هنا يتم تنفيذ الأمر!
      return `Executed: ${command}`;
    });
  }

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: SSTI to RCE
  async processTemplate(userId: string, labId: string, templateString: string) {
    try {
      // ❌ الثغرة: compile user-controlled template
      const compile = Handlebars.compile(templateString);

      const context = {
        user: 'developer',
        flag: 'FLAG{SSTI_RCE_ACHIEVED}',
        process: {
          env: { SECRET_KEY: 'production-secret-123' },
        },
      };

      const result = compile(context);

      // التحقق من RCE
      if (
        templateString.includes('exec') ||
        templateString.includes('process') ||
        templateString.includes('flag')
      ) {
        return {
          result,
          exploited: true,
          flag: 'FLAG{SSTI_RCE_ACHIEVED}',
          message: 'Remote Code Execution via SSTI successful!',
        };
      }

      return { result };
    } catch (error) {
      return { error: 'Template processing failed', details: error.message };
    }
  }
}
