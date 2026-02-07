import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';

@Injectable()
export class PracticeLabStateService {
  constructor(private prisma: PrismaService) {}

  /**
   * تهيئة بيانات اللاب للمستخدم بناءً على الـ initialState المخزن في جدول الـ Lab
   */
  async initializeState(userId: string, labId: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { initialState: true },
    });

    if (!lab) throw new NotFoundException('Lab configuration not found');

    const config = lab.initialState as any;

    // 1. تنظيف أي بيانات قديمة للمستخدم في هذا اللاب (Isolation)
    await this.prisma.$transaction([
      this.prisma.labGenericUser.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericBank.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericContent.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericLog.deleteMany({ where: { userId, labId } }),
    ]);

    // 2. إنشاء البيانات الجديدة بناءً على الـ Config
    if (config.users) {
      await this.prisma.labGenericUser.createMany({
        data: config.users.map((u) => ({ ...u, userId, labId })),
      });
    }

    if (config.banks) {
      await this.prisma.labGenericBank.createMany({
        data: config.banks.map((b) => ({ ...b, userId, labId })),
      });
    }

    if (config.contents) {
      await this.prisma.labGenericContent.createMany({
        data: config.contents.map((c) => ({ ...c, userId, labId })),
      });
    }

    return { status: 'success', message: 'Lab environment initialized' };
  }
}
