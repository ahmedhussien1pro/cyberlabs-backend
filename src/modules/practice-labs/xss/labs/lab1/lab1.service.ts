// src/modules/practice-labs/xss/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ❌ الثغرة: مدخل المستخدم يُعكس في الـ response بدون HTML encoding
  async search(userId: string, labId: string, query: string) {
    if (!query) throw new BadRequestException('Search query is required');

    const results = await this.prisma.labGenericContent.findMany({
      where: {
        userId,
        labId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    // ❌ الثغرة: query مُدمج مباشرة في النص بدون تعقيم
    // الـ frontend يعرض هذه الرسالة بـ dangerouslySetInnerHTML
    const message = `Asset '${query}' not found in inventory`;

    if (this.isXSSPayload(query)) {
      return {
        success: true,
        exploited: true,
        message, // ← يحتوي على الـ payload خام
        results,
        flag: 'FLAG{XSS_REFLECT_ASSET_MGR_101}',
        simulation:
          'Your payload was reflected into the HTML response without encoding. ' +
          "In a real browser, this executes immediately in the IT admin's session context.",
      };
    }

    return {
      success: true,
      exploited: false,
      message,
      results,
    };
  }

  private isXSSPayload(input: string): boolean {
    const patterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /on\w+\s*=/i, // onerror= onload= onclick= ontoggle=...
      /javascript:/i,
      /<img[^>]*>/i,
      /<svg[\s>]/i,
      /<iframe[\s>]/i,
      /<details[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
    ];
    return patterns.some((p) => p.test(input));
  }
}
