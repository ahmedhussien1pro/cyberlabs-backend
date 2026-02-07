import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // Login endpoint
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) throw new NotFoundException('Invalid credentials');

    return { success: true, sessionUser: username };
  }

  // ❌ الثغرة: Horizontal Privilege Escalation - يستخدم username من الـ parameter بدل الـ session
  async getProfile(userId: string, labId: string, targetUsername: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: targetUsername },
    });

    if (!user) throw new NotFoundException('User not found');

    // جلب البيانات الخاصة بالمستخدم المستهدف
    const privateData = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, author: targetUsername, isPublic: false },
    });

    // التحقق من الاستغلال
    if (targetUsername === 'charlie' && privateData?.body.includes('FLAG')) {
      return {
        user,
        privateData,
        exploited: true,
        flag: 'FLAG{HORIZONTAL_PRIVILEGE_ESCALATION}',
        message: 'Horizontal privilege escalation successful!',
      };
    }

    return { user, privateData };
  }
}
