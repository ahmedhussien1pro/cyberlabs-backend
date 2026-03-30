// src/modules/practice-labs/xss/labs/lab4/lab4.service.ts
// Refactored (PR #3):
//  - Removed local isXSSPayload() → XssDetectorEngine.isPayload()
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - FlagRecordService wired in

import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { XssDetectorEngine } from '../../../shared/engines/xss-detector.engine';

const LAB_SECRET  = 'xss_lab4_markdown_bypass_devprofile_2025';
const FLAG_PREFIX = 'XSS_LAB4';

@Injectable()
export class Lab4Service {
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

  async updateBio(userId: string, labId: string, bio: string) {
    if (!bio) throw new BadRequestException('Bio content is required');

    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });
    if (!profile) throw new NotFoundException('Profile not found. Please start the lab first.');

    await this.prisma.labGenericContent.update({
      where: { id: profile.id },
      data: { body: bio, author: 'pending_review' },
    });

    return { success: true, message: 'Bio updated. Profile is pending admin review.', preview: bio };
  }

  async getProfile(userId: string, labId: string) {
    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });
    if (!profile) throw new NotFoundException('Profile not found. Please start the lab first.');

    let extraData: Record<string, any> = {};
    try { extraData = profile.fileUrl ? JSON.parse(profile.fileUrl) : {}; } catch { extraData = {}; }

    return { success: true, profile: { bio: profile.body, status: profile.author ?? 'pending_review', ...extraData } };
  }

  async adminReviewProfile(userId: string, labId: string) {
    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });
    if (!profile) throw new NotFoundException('Profile not found.');

    const bio = profile.body || '';
    const detection = XssDetectorEngine.detect(bio);

    if (detection.detected) {
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        adminAction: 'Admin opened the Profile Review Panel',
        renderingChain: 'bio → marked.parse(bio) → innerHTML (without DOMPurify)',
        injectedPayload: bio,
        matchedVector: detection.matchedVector,
        simulation:
          'The Markdown parser rendered your inline HTML as-is. ' +
          'The browser executed the event handler in the admin context.',
        flag,
        fix: 'Always sanitize after parsing: innerHTML = DOMPurify.sanitize(marked.parse(bio))',
      };
    }

    let extraData: Record<string, any> = {};
    try { extraData = profile.fileUrl ? JSON.parse(profile.fileUrl) : {}; } catch { extraData = {}; }

    return {
      success: true, exploited: false,
      adminAction: 'Admin reviewed your profile — no XSS detected.',
      hint:
        'Try embedding raw HTML in your Markdown bio. ' +
        'The <details open ontoggle=alert(1)> or <img src=x onerror=alert(1)> are good starting points.',
      profile: { bio, status: profile.author, ...extraData },
    };
  }
}
