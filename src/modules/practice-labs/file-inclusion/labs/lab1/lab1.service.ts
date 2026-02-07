import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as fs from 'fs/promises';

@Injectable()
export class Lab1Service {
  private readonly FLAG = 'FLAG{LF1_B4S1C_1NCLUS10N}';
  private readonly VIEWS_DIR = '/views/';

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
      availablePages: ['home', 'about', 'contact'],
      hint: 'Try including system files like /etc/passwd or config files',
    };
  }

  /**
   * ⚠️ VULNERABLE: Local File Inclusion via page parameter
   */
  async includePage(userId: string, labId: string, page: string) {
    if (!page) {
      throw new BadRequestException('Page parameter is required');
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

    try {
      // ⚠️ VULNERABILITY: Direct file inclusion without validation
      let content = '';
      let includedFile = '';

      // Simulate file inclusion
      if (page === 'home' || page === 'about' || page === 'contact') {
        content = `<h1>${page.toUpperCase()} Page</h1><p>Welcome to ${page}!</p>`;
        includedFile = `${this.VIEWS_DIR}${page}.php`;
      } else if (page.includes('/etc/passwd')) {
        content =
          'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nuser:x:1000:1000::/home/user:/bin/bash';
        includedFile = '/etc/passwd';
      } else if (page.includes('config')) {
        content = `<?php\n$db_host = "localhost";\n$db_user = "admin";\n$db_password = "super_secret_123";\n$flag = "${this.FLAG}";\n?>`;
        includedFile = '/var/www/html/config.php';
      } else if (page.includes('/proc/self/environ')) {
        content =
          'USER=www-data\nPATH=/usr/bin\nSCRIPT_NAME=/index.php\nHTTP_USER_AGENT=Mozilla/5.0';
        includedFile = '/proc/self/environ';
      } else {
        content = `<p>Page not found: ${page}</p>`;
        includedFile = page;
      }

      // Track attempt
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      // Check if flag was found
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      // Check if LFI was used
      const usedLFI =
        page.includes('/') ||
        page.includes('..') ||
        !['home', 'about', 'contact'].includes(page);

      if (flagFound && usedLFI) {
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
            code: page,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 LFI successful! Config file included!',
          includedFile,
          hint: 'You successfully exploited Local File Inclusion!',
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        usedLFI,
        includedFile,
        message: usedLFI
          ? 'File included via LFI. Keep looking for sensitive data!'
          : 'Page loaded successfully',
        hint: 'Try: /etc/passwd, ../../../var/www/html/config.php, or /proc/self/environ',
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
        message: 'File inclusion failed',
        hint: 'Check your path syntax',
      };
    }
  }

  /**
   * ⚠️ VULNERABLE: Template inclusion
   */
  async includeTemplate(userId: string, labId: string, file: string) {
    if (!file) {
      throw new BadRequestException('File parameter is required');
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

    try {
      // ⚠️ VULNERABILITY: Template inclusion without validation
      let content = '';

      if (file.includes('config') || file.includes('flag')) {
        content = this.FLAG;
      } else if (file.includes('passwd')) {
        content = 'root:x:0:0:root:/root:/bin/bash';
      } else {
        content = 'Template content';
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
        message: 'Template loaded',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Template not found',
      };
    }
  }
}
