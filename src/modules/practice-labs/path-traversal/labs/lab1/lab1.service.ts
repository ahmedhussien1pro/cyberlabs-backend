import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class Lab1Service {
  private readonly FLAG = 'FLAG{P4TH_TR4V3RS4L_B4S1C}';
  private readonly ALLOWED_DIR = '/public/images';

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
      allowedDirectory: this.ALLOWED_DIR,
      hint: 'Try using ../ to navigate to parent directories',
    };
  }

  /**
   * ⚠️ VULNERABLE: Path traversal in file reading
   */
  async readFile(userId: string, labId: string, filename: string) {
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

    // ⚠️ VULNERABILITY: Direct path concatenation without sanitization
    const filePath = path.join(this.ALLOWED_DIR, filename);

    try {
      // Simulate file reading
      let content = '';

      // Check common sensitive files
      if (
        filePath.includes('/etc/passwd') ||
        filename.includes('../../../etc/passwd')
      ) {
        content =
          'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000::/home/user:/bin/bash';
      } else if (filePath.includes('flag.txt') || filename.includes('flag')) {
        content = this.FLAG;
      } else if (filePath.includes('config') || filename.includes('config')) {
        content = '{"secret": "admin_password_123", "api_key": "secret_key"}';
      } else {
        content = 'Sample image file content';
      }

      // Track attempt
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      // Check if flag was accessed
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      // Check if traversal was used
      const usedTraversal =
        filename.includes('../') || filename.includes('..\\');

      if (flagFound && usedTraversal) {
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
          message: '🎉 Path traversal successful! Flag captured!',
          hint: 'You successfully read files outside the allowed directory!',
          requestedPath: filePath,
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        usedTraversal,
        message: usedTraversal
          ? 'Directory traversal detected! Keep looking for the flag.'
          : 'File read successfully',
        requestedPath: filePath,
        hint: 'Try: ../../etc/passwd or ../../../var/www/flag.txt',
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
        hint: 'Check your path. Try using ../ to go up directories',
      };
    }
  }

  /**
   * ⚠️ VULNERABLE: Path traversal in file download
   */
  async downloadFile(userId: string, labId: string, filePath: string) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
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

    // ⚠️ VULNERABILITY: No path validation
    try {
      let content = '';

      if (filePath.includes('flag')) {
        content = this.FLAG;
      } else if (filePath.includes('passwd')) {
        content = 'root:x:0:0:root:/root:/bin/bash';
      } else {
        content = 'File content';
      }

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      return {
        success: true,
        content,
        filename: path.basename(filePath),
        message: 'File downloaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Download failed',
      };
    }
  }
}
