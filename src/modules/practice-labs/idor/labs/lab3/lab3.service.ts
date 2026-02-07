import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getProfile(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) throw new NotFoundException('User not found');

    // ✅ نقرأ bio من meta
    const meta = user.meta as any;
    const bio = meta?.bio || '';

    if (user.role === 'PREMIUM' && bio.includes('FLAG')) {
      return {
        ...user,
        bio,
        exploited: true,
        message: 'IDOR exploited successfully!',
      };
    }

    return { ...user, bio };
  }

  async updateProfile(
    userId: string,
    labId: string,
    username: string,
    newBio: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) throw new NotFoundException('User not found');

    // ✅ نحدّث meta
    const currentMeta = (user.meta as any) || {};

    return this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: {
        meta: {
          ...currentMeta,
          bio: newBio,
        },
      },
    });
  }
}
