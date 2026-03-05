import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    await this.stateService.initializeState(userId, labId);

    // نزرع reviews شرعية مبدئية
    await this.prisma.labGenericLog.createMany({
      data: [
        {
          userId,
          labId,
          type: 'REVIEW',
          action: 'SUBMIT',
          meta: {
            productId: 'techmart-dock-07',
            author: 'verified_buyer_99',
<<<<<<< HEAD
            content:
              'Excellent build quality! Works perfectly with my MacBook Pro.',
=======
            content: 'Excellent build quality! Works perfectly with my MacBook Pro.',
>>>>>>> c3d8b088be6ccafbb89db88f836a509781103f04
            rating: 5,
            status: 'pending',
          },
        },
        {
          userId,
          labId,
          type: 'REVIEW',
          action: 'SUBMIT',
          meta: {
            productId: 'techmart-dock-07',
            author: 'alice_buyer',
            content: 'Fast shipping. The product matches the description.',
            rating: 4,
            status: 'pending',
          },
        },
      ],
    });

    return { status: 'success', message: 'Lab environment initialized' };
  }

  // ✅ التخزين يبدو آمنًا — لكن content مخزّن raw بدون sanitization
  async submitReview(
    userId: string,
    labId: string,
    content: string,
    rating: number,
  ) {
    if (!content) throw new BadRequestException('Review content is required');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'REVIEW',
        action: 'SUBMIT',
        meta: {
          productId: 'techmart-dock-07',
          author: 'current_user',
          content, // ❌ مخزّن raw بدون تعقيم
          rating: rating ?? 1,
          status: 'pending',
        },
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
    const reviews = await this.prisma.labGenericLog.findMany({
      where: { userId, labId, type: 'REVIEW' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      // ❌ content يُرجَع raw — الـ frontend يعرضه بـ dangerouslySetInnerHTML
      reviews: reviews.map((r) => ({
        id: r.id,
        ...(r.meta as any),
        createdAt: r.createdAt,
      })),
    };
  }

  // ❌ الثغرة: Admin يعرض review.content بـ innerHTML في لوحة التحكم
  async adminModerate(userId: string, labId: string) {
    const reviews = await this.prisma.labGenericLog.findMany({
      where: { userId, labId, type: 'REVIEW' },
    });

    const maliciousReview = reviews.find((r) => {
      const meta = r.meta as any;
      return meta?.content && this.isXSSPayload(meta.content);
    });

    if (maliciousReview) {
      const meta = maliciousReview.meta as any;
      return {
        success: true,
        exploited: true,
        adminAction: 'Admin opened the Review Moderation Dashboard',
        maliciousContent: meta.content,
        simulation:
          'The stored payload executed inside the admin browser context. ' +
          'The admin session cookie has been captured.',
        adminSessionToken: 'FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
        flag: 'FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
        fix:
          'Sanitize all user-generated content before inserting into innerHTML. ' +
          'Use DOMPurify or a server-side sanitizer like sanitize-html.',
        reviews: reviews.map((r) => ({ id: r.id, ...(r.meta as any) })),
      };
    }

    return {
      success: true,
      exploited: false,
<<<<<<< HEAD
      adminAction:
        'Admin opened Moderation Dashboard — no XSS payload detected.',
=======
      adminAction: 'Admin opened Moderation Dashboard — no XSS payload detected.',
>>>>>>> c3d8b088be6ccafbb89db88f836a509781103f04
      hint: 'Submit a review containing an XSS payload first, then trigger admin moderation.',
      reviews: reviews.map((r) => ({ id: r.id, ...(r.meta as any) })),
    };
  }

  private isXSSPayload(input: string): boolean {
    const patterns = [
      /<script[\s>]/i,
      /<\/script>/i,
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
