import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Reflected XSS - No output encoding
  async search(userId: string, labId: string, query: string) {
    const contents = await this.prisma.labGenericContent.findMany({
      where: {
        userId,
        labId,
        OR: [{ title: { contains: query } }, { body: { contains: query } }],
      },
    });

    // ❌ الثغرة: إرجاع user input بدون encoding
    const message = `Search results for: ${query}`;

    // التحقق من XSS
    if (
      query.toLowerCase().includes('<script') ||
      query.toLowerCase().includes('onerror') ||
      query.toLowerCase().includes('onload')
    ) {
      return {
        message,
        results: contents,
        exploited: true,
        flag: 'FLAG{REFLECTED_XSS_EXECUTED}',
        warning: 'XSS payload detected and would execute in browser!',
      };
    }

    return { message, results: contents };
  }
}
