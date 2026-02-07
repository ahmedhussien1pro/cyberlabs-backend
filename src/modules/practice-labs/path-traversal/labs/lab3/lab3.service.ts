import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as path from 'path';

@Injectable()
export class Lab3Service {
  private readonly FLAG = 'FLAG{P4TH_TR4V3RS4L_NULL_BYT3}';
  private readonly ALLOWED_DIR = '/uploads/documents';
  private readonly REQUIRED_EXT = '.pdf';

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
      requiredExtension: this.REQUIRED_EXT,
      hint: 'Use null byte (%00) to bypass extension validation: /etc/passwd%00.pdf',
    };
  }

  /**
   * ⚠️ VULNERABLE: Extension validation vulnerable to null byte injection
   */
  async viewDocument(userId: string, labId: string, document: string) {
    if (!document) {
      throw new BadRequestException('Document path is required');
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

    // ⚠️ VULNERABILITY: Extension check before null byte processing
    if (!document.endsWith(this.REQUIRED_EXT)) {
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
        message: 'Only PDF files are allowed',
        hint: 'Try null byte injection: /path/to/file%00.pdf',
      };
    }

    try {
      // ⚠️ VULNERABILITY: Null byte truncates the path in some languages
      // Simulating null byte behavior
      let actualPath = document;
      if (document.includes('%00')) {
        actualPath = document.split('%00')[0]; // Null byte truncates
      } else if (document.includes('\0')) {
        actualPath = document.split('\0')[0];
      }

      let content = '';
      let usedNullByte = document.includes('%00') || document.includes('\0');

      if (actualPath.includes('secret') || actualPath.includes('flag')) {
        content = this.FLAG;
      } else if (actualPath.includes('passwd')) {
        content = 'root:x:0:0:root:/root:/bin/bash';
      } else {
        content = 'PDF document content';
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

      if (flagFound && usedNullByte) {
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
            code: document,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Null byte injection successful!',
          requestedPath: document,
          actualPath,
          hint: 'You bypassed extension validation using null byte!',
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        usedNullByte,
        message: usedNullByte
          ? 'Null byte detected! Keep exploring.'
          : 'Document read successfully',
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
        message: 'Document not found',
      };
    }
  }
}
