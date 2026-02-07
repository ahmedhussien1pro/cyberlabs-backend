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

  // ❌ الثغرة: Excessive Data Exposure - يرجع كل الـ fields بما فيها الحساسة
  async getAllUsers(userId: string, labId: string) {
    const users = await this.prisma.labGenericUser.findMany({
      where: { userId, labId },
      // ❌ الثغرة: مافيش select للـ fields المسموحة فقط
      // يرجع كل حاجة: password, email, role, etc
    });

    // التحقق من الاستغلال
    const hasFlag = users.some((u) => u.password?.includes('FLAG'));

    if (hasFlag) {
      return {
        users,
        exploited: true,
        message:
          'Excessive Data Exposure! Sensitive fields like passwords exposed in API response',
      };
    }

    return { users };
  }

  // ❌ الثغرة: يرجع بيانات حساسة في Profile API
  async getUserProfile(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
      // يرجع كل الـ fields بما فيها meta, internal IDs, etc
    });

    return { profile: user };
  }

  // ❌ الثغرة: Nested object exposure
  async getUserWithRelations(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    // جلب كل البيانات المرتبطة بدون filtering
    const contents = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: username },
    });

    const logs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId },
    });

    return {
      user, // كل الـ fields
      contents, // كل المحتوى
      logs, // كل الـ logs
      _internal: {
        // ❌ بيانات داخلية مكشوفة
        dbId: user?.id,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
