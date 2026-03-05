import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: msg يُعاد raw — الـ frontend يضعه في innerHTML (DOM sink)
  async getDashboard(userId: string, labId: string, msg: string) {
    const tasks = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
    });

    return {
      success: true,
      // ❌ msg يُرجَع كما هو بدون أي encoding
      // Frontend: notificationBanner.innerHTML = data.notification
      notification: msg || null,
      // LabGenericContent fields: id, title, body, isPublic, author, fileUrl
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.body,
        isPublic: t.isPublic,
        assignedTo: t.author,
        link: t.fileUrl,
      })),
    };
  }

  // المتعلم يرسل الـ URL المصمّم — نستخرج msg ونتحقق من الـ payload
  async verifyPayload(userId: string, labId: string, craftedUrl: string) {
    if (!craftedUrl) throw new BadRequestException('Crafted URL is required');

    let msg = '';
    try {
      const fullUrl = craftedUrl.startsWith('http')
        ? craftedUrl
        : `https://sprintboard.app${craftedUrl}`;
      const urlObj = new URL(fullUrl);
      msg = urlObj.searchParams.get('msg') || '';
    } catch {
      throw new BadRequestException(
        'Invalid URL format. Example: /dashboard?msg=<img src=x onerror=alert(1)>',
      );
    }

    if (!msg) {
      return {
        success: false,
        exploited: false,
        message: 'No msg parameter found in the URL.',
      };
    }

    if (this.isXSSPayload(msg)) {
      return {
        success: true,
        exploited: true,
        craftedUrl,
        extractedPayload: msg,
        injectionContext:
          "document.getElementById('notification-banner').innerHTML = msg",
        simulation:
          'The server never processed this payload — it was handled entirely ' +
          'by the browser JavaScript reading window.location.search. ' +
          'This is the defining characteristic of DOM-Based XSS: no server involvement.',
        flag: 'FLAG{XSS_DOM_SINK_INNERHTML_EXPLOIT_344}',
        fix:
          'Replace innerHTML with textContent, or use ' +
          'DOMPurify.sanitize(msg) before innerHTML assignment.',
      };
    }

    return {
      success: false,
      exploited: false,
      extractedPayload: msg,
      message:
        'No valid XSS payload in the msg parameter. ' +
        'Remember: <script> tags do NOT execute via innerHTML. Use event handlers.',
    };
  }

  private isXSSPayload(input: string): boolean {
    const patterns = [
      /<script[\s>]/i,
      /on\w+\s*=/i,
      /javascript:/i,
      /<img[^>]*>/i,
      /<svg[\s>]/i,
      /<iframe[\s>]/i,
      /<details[\s>]/i,
    ];
    return patterns.some((p) => p.test(input));
  }
}
