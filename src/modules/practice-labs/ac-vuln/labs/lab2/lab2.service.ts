import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

    return { success: true, username: user.username, role: user.role };
  }

  // ❌ الثغرة: Vertical Privilege Escalation - يقبل role من الـ request!
  async updateProfile(
    userId: string,
    labId: string,
    username: string,
    newEmail?: string,
    newRole?: string, // ❌ الثغرة: يسمح بتحديث الـ role!
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {};
    if (newEmail) updateData.email = newEmail;
    if (newRole) updateData.role = newRole; // ❌ خطر: تحديث مباشر للـ role

    const updated = await this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: updateData,
    });

    return { success: true, user: updated };
  }

  // Admin panel - يتحقق من الـ role بس بدون session proper
  async accessAdminPanel(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) throw new NotFoundException('User not found');

    // التحقق من الصلاحية
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // التحقق من الاستغلال
    if (username === 'user') {
      // لو المستخدم العادي وصل هنا
      return {
        success: true,
        flag: 'FLAG{VERTICAL_PRIVILEGE_ESCALATION}',
        exploited: true,
        message: 'Vertical privilege escalation successful!',
        adminData: 'Sensitive admin information',
      };
    }

    return { success: true, adminData: 'Sensitive admin information' };
  }
}
