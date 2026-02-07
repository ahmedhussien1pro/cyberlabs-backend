import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';

@Injectable()
export class LabProgressService {
  constructor(private prisma: PrismaService) {}

  // تحديث عدد المحاولات أو الهينتات المستخدمة
  async updateProgress(
    userId: string,
    labId: string,
    data: { incrementHints?: boolean; incrementAttempts?: boolean },
  ) {
    return this.prisma.userLabProgress.upsert({
      where: { userId_labId: { userId, labId } },
      update: {
        hintsUsed: data.incrementHints ? { increment: 1 } : undefined,
        attempts: data.incrementAttempts ? { increment: 1 } : undefined,
        lastAccess: new Date(),
      },
      create: {
        userId,
        labId,
        hintsUsed: data.incrementHints ? 1 : 0,
        attempts: data.incrementAttempts ? 1 : 0,
      },
    });
  }
}
