// src/modules/practice-labs/xss/labs/lab3/lab3.service.ts
// Refactored (PR #3):
//  - Removed local isXSSPayload() → XssDetectorEngine.isPayload()
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - Improved: empty msg now returns a proper validation error
//  - FlagRecordService wired in

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { XssDetectorEngine } from '../../../shared/engines/xss-detector.engine';

const LAB_SECRET  = 'xss_lab3_d0m_sink_sprintboard_2025';
const FLAG_PREFIX = 'XSS_LAB3';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, labId, 'attempt-1', flag);
    return state;
  }

  async getDashboard(userId: string, labId: string, msg: string) {
    const tasks = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
    });
    return {
      success: true,
      notification: msg || null,
      tasks: tasks.map((t) => ({
        id: t.id, title: t.title, status: t.body,
        isPublic: t.isPublic, assignedTo: t.author, link: t.fileUrl,
      })),
    };
  }

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
      throw new BadRequestException(
        'No msg parameter found in the crafted URL. ' +
        'Your URL must include ?msg=<your-xss-payload>',
      );
    }

    const detection = XssDetectorEngine.detect(msg);

    if (detection.detected) {
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true, craftedUrl,
        extractedPayload: msg,
        matchedVector: detection.matchedVector,
        injectionContext: "document.getElementById('notification-banner').innerHTML = msg",
        simulation:
          'The server never processed this payload — it was handled entirely ' +
          'by the browser JavaScript reading window.location.search. ' +
          'This is the defining characteristic of DOM-Based XSS: no server involvement.',
        flag,
        fix:
          'Replace innerHTML with textContent, or use ' +
          'DOMPurify.sanitize(msg) before innerHTML assignment.',
      };
    }

    return {
      success: false, exploited: false,
      extractedPayload: msg,
      message:
        'No valid XSS payload in the msg parameter. ' +
        'Remember: <script> tags do NOT execute via innerHTML. Use event handlers.',
    };
  }
}
