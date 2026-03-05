import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// LabGenericContent fields: id, userId, labId, title, body, isPublic, author, fileUrl
// We use:
//   title   → record identifier ('Developer Profile')
//   body    → raw bio text (the vulnerable field)
//   author  → review status  ('pending_review' | 'approved')
//   fileUrl → JSON-serialized extra profile data (skills, github)

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: bio يُخزَّن في body بدون sanitization
  // marked.js سيُمرّر inline HTML كما هو عند الـ render
  async updateBio(userId: string, labId: string, bio: string) {
    if (!bio) throw new BadRequestException('Bio content is required');

    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Please start the lab first.');
    }

    // ❌ body يُخزَّن raw بدون HTML sanitization
    await this.prisma.labGenericContent.update({
      where: { id: profile.id },
      data: {
        body: bio,
        author: 'pending_review',
      },
    });

    return {
      success: true,
      message: 'Bio updated. Profile is pending admin review.',
      // ❌ Preview يُرجَع raw — الـ frontend يعرضه عبر marked.parse(bio) + innerHTML
      preview: bio,
    };
  }

  async getProfile(userId: string, labId: string) {
    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Please start the lab first.');
    }

    // نحوّل fileUrl (JSON string) إلى object لعرض بيانات الملف الشخصي
    let extraData: Record<string, any> = {};
    try {
      extraData = profile.fileUrl ? JSON.parse(profile.fileUrl) : {};
    } catch {
      extraData = {};
    }

    return {
      success: true,
      profile: {
        // ❌ bio يُرجَع raw ليُعالَج بـ marked.parse() في الـ frontend
        bio: profile.body,
        status: profile.author ?? 'pending_review',
        ...extraData,
      },
    };
  }

  // ❌ الثغرة: Admin يعرض bio عبر: innerHTML = marked.parse(bio) بدون DOMPurify
  async adminReviewProfile(userId: string, labId: string) {
    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'Developer Profile' },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const bio = profile.body || '';

    if (this.isXSSPayload(bio)) {
      return {
        success: true,
        exploited: true,
        adminAction: 'Admin opened the Profile Review Panel',
        renderingChain: 'bio → marked.parse(bio) → innerHTML (without DOMPurify)',
        injectedPayload: bio,
        simulation:
          'The Markdown parser rendered your inline HTML as-is. ' +
          'The browser executed the event handler in the admin context.',
        adminToken: 'FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519}',
        flag: 'FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519}',
        fix:
          'Always sanitize after parsing: ' +
          'innerHTML = DOMPurify.sanitize(marked.parse(bio))',
      };
    }

    let extraData: Record<string, any> = {};
    try {
      extraData = profile.fileUrl ? JSON.parse(profile.fileUrl) : {};
    } catch {
      extraData = {};
    }

    return {
      success: true,
      exploited: false,
      adminAction: 'Admin reviewed your profile — no XSS detected.',
      hint:
        'Try embedding raw HTML in your Markdown bio. ' +
        'The <details open ontoggle=alert(1)> or <img src=x onerror=alert(1)> ' +
        'are good starting points.',
      profile: { bio, status: profile.author, ...extraData },
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
      /<object[\s>]/i,
    ];
    return patterns.some((p) => p.test(input));
  }
}
