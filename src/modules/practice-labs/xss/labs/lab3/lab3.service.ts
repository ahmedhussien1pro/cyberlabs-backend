import { Injectable } from '@nestjs/common';
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

  // ❌ الثغرة: DOM-based XSS - يرجع HTML يستخدم URL parameters بدون validation
  async getDashboard(userId: string, labId: string, name?: string) {
    // ❌ الثغرة: البيانات ترجع للفرونت اند ليتم معالجتها في DOM
    const dashboardHTML = `
      <!DOCTYPE html>
      <html>
        <head><title>Dashboard</title></head>
        <body>
          <h1>Welcome Dashboard</h1>
          <div id="greeting"></div>
          <script>
            // ❌ الثغرة: استخدام URL parameters مباشرة في DOM
            const urlParams = new URLSearchParams(window.location.search);
            const name = urlParams.get('name') || 'Guest';
            document.getElementById('greeting').innerHTML = 'Hello ' + name;
          </script>
        </body>
      </html>
    `;

    // التحقق من XSS في parameter
    if (
      name &&
      (name.includes('<') || name.includes('script') || name.includes('img'))
    ) {
      return {
        html: dashboardHTML,
        exploited: true,
        flag: 'FLAG{DOM_BASED_XSS_EXPLOITED}',
        message: 'DOM-based XSS vulnerability detected!',
        hint: 'Payload would execute when URL is loaded in browser',
      };
    }

    return { html: dashboardHTML };
  }

  // Endpoint لتسجيل نجاح الهجوم
  async reportXSS(userId: string, labId: string, payload: string) {
    await this.prisma.labGenericLog.create({
      data: { userId, labId, type: 'XSS_ATTEMPT' },
    });

    if (
      payload.toLowerCase().includes('document.cookie') ||
      payload.toLowerCase().includes('alert')
    ) {
      return {
        success: true,
        flag: 'FLAG{DOM_BASED_XSS_EXPLOITED}',
        message: 'DOM XSS successfully executed!',
      };
    }

    return { success: true };
  }
}
