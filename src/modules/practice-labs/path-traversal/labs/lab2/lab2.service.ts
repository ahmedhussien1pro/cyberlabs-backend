import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as path from 'path';

@Injectable()
export class Lab2Service {
  private readonly FLAG = 'FLAG{P4TH_TR4V3RS4L_F1LT3R_BYP4SS}';
  private readonly ALLOWED_DIR = '/var/www/public';
  private readonly BLOCKED_PATTERNS = ['../'];

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
      blockedPatterns: this.BLOCKED_PATTERNS,
      hint: 'Filter blocks ../ but can be bypassed with: ..\\, ..../, URL encoding, or absolute paths',
    };
  }

  /**
   * ⚠️ VULNERABLE: Weak filter that can be bypassed
   */
  async readFileWithFilter(userId: string, labId: string, filename: string) {
    if (!filename) {
      throw new BadRequestException('Filename is required');
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

    // ⚠️ VULNERABILITY: Simple filter that only blocks exact "../" pattern
    if (filename.includes('../')) {
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
        message: 'Path traversal detected and blocked',
        hint: 'Try alternative encodings: ..\\, ..../, %2e%2e%2f, or absolute paths',
      };
    }

    try {
      let content = '';
      let bypassMethod = '';

      // Check various bypass methods
      if (filename.includes('..\\') || filename.includes('..%5c')) {
        content = this.FLAG;
        bypassMethod = 'Backslash bypass';
      } else if (filename.includes('....//') || filename.includes('....\\\\')) {
        content = this.FLAG;
        bypassMethod = 'Double encoding bypass';
      } else if (
        filename.includes('%2e%2e%2f') ||
        filename.includes('%2e%2e/')
      ) {
        content = this.FLAG;
        bypassMethod = 'URL encoding bypass';
      } else if (filename.startsWith('/')) {
        content = filename.includes('flag')
          ? this.FLAG
          : 'Absolute path content';
        bypassMethod = 'Absolute path bypass';
      } else {
        content = 'Public file content';
      }

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
            code: filename,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Filter bypassed successfully!',
          bypassMethod,
          hint: 'You successfully bypassed the path traversal filter!',
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        message: 'File read successfully',
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
        message: 'File not found',
      };
    }
  }
}
