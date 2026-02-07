import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import axios from 'axios';

@Injectable()
export class Lab2Service {
  private readonly FLAG = 'FLAG{SSRF_BL4CKL1ST_BYP4SS}';
  private readonly BLACKLIST = ['localhost', '127.0.0.1', '0.0.0.0', 'admin'];

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getState(userId: string, labId: string) {
    const instance = await this.prisma.labInstance.findUnique({
      where: {
        userId_labId: { userId, labId },
      },
    });

    if (!instance) {
      throw new NotFoundException(
        'Lab instance not found. Please start the lab first.',
      );
    }

    return {
      success: true,
      state: instance.state,
      isActive: instance.isActive,
      startedAt: instance.startedAt,
      blacklist: this.BLACKLIST,
      hint: 'Blacklist can be bypassed using alternative representations like 127.1, 0x7f.0.0.1, or ::1',
    };
  }

  /**
   * ⚠️ VULNERABLE: Weak blacklist validation
   */
  async fetchUrlWithBlacklist(userId: string, labId: string, url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    const instance = await this.prisma.labInstance.findUnique({
      where: {
        userId_labId: { userId, labId },
      },
    });

    if (!instance) {
      throw new NotFoundException(
        'Lab instance not found. Please start the lab first.',
      );
    }

    const progress = await this.prisma.userLabProgress.findUnique({
      where: {
        userId_labId: { userId, labId },
      },
    });

    if (!progress) {
      throw new NotFoundException(
        'Lab progress not found. Please start the lab first.',
      );
    }

    // ⚠️ VULNERABILITY: Simple string matching blacklist (easily bypassed)
    const urlLower = url.toLowerCase();
    const isBlacklisted = this.BLACKLIST.some((blocked) =>
      urlLower.includes(blocked),
    );

    if (isBlacklisted) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      return {
        success: false,
        blocked: true,
        message: 'URL is blacklisted',
        hint: 'Try alternative IP representations: 127.1, 0x7f.0.0.1, [::1], or 127.0.0.1.nip.io',
      };
    }

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      const content =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      if (flagFound) {
        await this.prisma.userLabProgress.update({
          where: { id: progress.id },
          data: {
            flagSubmitted: true,
            completedAt: new Date(),
            progress: 100,
          },
        });

        await this.prisma.labSubmission.create({
          data: {
            userId,
            labId,
            flagAnswer: this.FLAG,
            isCorrect: true,
            attemptNumber: progress.attempts + 1,
            timeTaken: 0,
            code: url,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Blacklist bypassed! SSRF successful!',
          bypassMethod: url,
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        message: 'URL fetched successfully',
      };
    } catch (error) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch URL',
      };
    }
  }
}
