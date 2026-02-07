import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Stored XSS - تخزين user input بدون sanitization
  async addComment(
    userId: string,
    labId: string,
    postId: string,
    comment: string,
  ) {
    const newContent = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: 'Comment',
        body: comment, // ❌ الثغرة: تخزين مباشر بدون تنظيف
        author: 'user',
        isPublic: true,
      },
    });

    // التحقق من XSS
    if (
      comment.toLowerCase().includes('<script') ||
      comment.toLowerCase().includes('onerror') ||
      comment.toLowerCase().includes('javascript:')
    ) {
      return {
        success: true,
        comment: newContent,
        exploited: true,
        flag: 'FLAG{STORED_XSS_PERSISTENT_ATTACK}',
        message:
          'Malicious payload stored! Will execute for all users viewing this page.',
      };
    }

    return { success: true, comment: newContent };
  }

  // عرض التعليقات (بدون encoding!)
  async getComments(userId: string, labId: string) {
    const comments = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, title: 'Comment' },
    });

    return { comments };
  }
}
