// src/modules/practice-labs/xss/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { XssDetectorEngine } from '../../../shared/engines/xss-detector.engine';

const LAB_SLUG    = 'xss-review-moderation-stored';
const LAB_SECRET  = 'xss_lab2_st0red_techmart_review_2025';
const FLAG_PREFIX = 'XSS_LAB2';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const resolvedId = state.labId;

    const flag = FlagPolicyEngine.generate(userId, resolvedId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, resolvedId, 'attempt-1', flag);

    await this.prisma.labGenericLog.createMany({
      data: [
        {
          userId, labId: resolvedId, type: 'REVIEW', action: 'SUBMIT',
          meta: { productId: 'techmart-dock-07', author: 'verified_buyer_99',
            content: 'Excellent build quality! Works perfectly with my MacBook Pro.',
            rating: 5, status: 'pending' },
        },
        {
          userId, labId: resolvedId, type: 'REVIEW', action: 'SUBMIT',
          meta: { productId: 'techmart-dock-07', author: 'alice_buyer',
            content: 'Fast shipping. The product matches the description.',
            rating: 4, status: 'pending' },
        },
      ],
    });

    return { status: 'success', message: 'Lab environment initialized', labId: resolvedId };
  }

  async submitReview(userId: string, labId: string, content: string, rating: number) {
    if (!content) throw new BadRequestException('Review content is required');
    const resolvedId = await this.stateService.resolveLabId(labId);

    await this.prisma.labGenericLog.create({
      data: {
        userId, labId: resolvedId, type: 'REVIEW', action: 'SUBMIT',
        meta: { productId: 'techmart-dock-07', author: 'current_user',
          content, rating: rating ?? 1, status: 'pending' },
      },
    });

    return {
      success: true,
      message:
        'Review submitted successfully. Pending admin moderation. ' +
        'Click "Simulate Admin Moderation" to see the impact.',
    };
  }

  async getReviews(userId: string, labId: string) {
    const resolvedId = await this.stateService.resolveLabId(labId);
    const reviews = await this.prisma.labGenericLog.findMany({
      where: { userId, labId: resolvedId, type: 'REVIEW' },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      reviews: reviews.map((r) => ({ id: r.id, ...(r.meta as any), createdAt: r.createdAt })),
    };
  }

  async adminModerate(userId: string, labId: string) {
    const resolvedId = await this.stateService.resolveLabId(labId);
    const reviews = await this.prisma.labGenericLog.findMany({
      where: { userId, labId: resolvedId, type: 'REVIEW' },
    });

    const maliciousReview = reviews.find((r) => {
      const meta = r.meta as any;
      return meta?.content && XssDetectorEngine.isPayload(meta.content);
    });

    if (maliciousReview) {
      const meta = maliciousReview.meta as any;
      const flag = FlagPolicyEngine.generate(userId, resolvedId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        adminAction: 'Admin opened the Review Moderation Dashboard',
        maliciousContent: meta.content,
        simulation:
          'The stored payload executed inside the admin browser context. ' +
          'The admin session cookie has been captured.',
        flag,
        fix:
          'Sanitize all user-generated content before inserting into innerHTML. ' +
          'Use DOMPurify or a server-side sanitizer like sanitize-html.',
        reviews: reviews.map((r) => ({ id: r.id, ...(r.meta as any) })),
      };
    }

    return {
      success: true, exploited: false,
      adminAction: 'Admin opened Moderation Dashboard — no XSS payload detected.',
      hint: 'Submit a review containing an XSS payload first, then trigger admin moderation.',
      reviews: reviews.map((r) => ({ id: r.id, ...(r.meta as any) })),
    };
  }
}
