import { Injectable, NotFoundException } from '@nestjs/common';
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

  async listFiles(userId: string, labId: string) {
    return this.prisma.labGenericContent.findMany({
      where: { userId, labId },
      select: {
        id: true,
        title: true,
        author: true,
        isPublic: true, // ✅ الحقول الموجودة فعلاً في Schema
      },
    });
  }

  async readFile(userId: string, labId: string, fileId: string) {
    const file = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, id: fileId },
    });

    if (!file) throw new NotFoundException('File not found');

    if (file.author === 'admin' && file.body.includes('FLAG')) {
      return {
        ...file,
        exploited: true,
        message: 'Congratulations! You exploited IDOR vulnerability',
      };
    }

    return file;
  }
}
