import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private readonly FLAG = 'FLAG{L0G_P01S0N1NG_RC3}';
  private readonly LOG_FILE = '/var/log/apache2/access.log';
  private accessLogs: Map<string, string[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    // Initialize empty log for this user
    const key = `${userId}_${labId}`;
    this.accessLogs.set(key, []);
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

    const key = `${userId}_${labId}`;
    const logs = this.accessLogs.get(key) || [];

    return {
      success: true,
      state: instance.state,
      isActive: instance.isActive,
      startedAt: instance.startedAt,
      logFile: this.LOG_FILE,
      logCount: logs.length,
      hint: 'Poison access logs with PHP code in User-Agent, then include the log file',
    };
  }

  /**
   * ⚠️ VULNERABLE: LFI + Log poisoning
   */
  async viewPageWithLogging(
    userId: string,
    labId: string,
    file: string,
    userAgent: string,
  ) {
    if (!file) {
      throw new BadRequestException('File parameter is required');
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

    // Log the access with User-Agent
    const key = `${userId}_${labId}`;
    const logs = this.accessLogs.get(key) || [];
    const timestamp = new Date().toISOString();
    logs.push(
      `[${timestamp}] GET /view?file=${file} - User-Agent: ${userAgent || 'Unknown'}`,
    );
    this.accessLogs.set(key, logs);

    try {
      let content = '';
      let isPoisoned = false;
      let codeExecuted = false;

      // ⚠️ VULNERABILITY: LFI allows including log file
      if (file.includes('access.log') || file.includes('/var/log')) {
        // Include log file content
        content = logs.join('\n');

        // Check if User-Agent contains PHP code
        if (
          userAgent &&
          (userAgent.includes('<?php') || userAgent.includes('<?='))
        ) {
          isPoisoned = true;
          // Simulate PHP code execution from log
          if (
            userAgent.includes('system') ||
            userAgent.includes('passthru') ||
            userAgent.includes('exec')
          ) {
            codeExecuted = true;
            content += `\n\n[Code Executed]\n${this.FLAG}`;
          }
        }
      } else {
        content = `Page content for: ${file}`;
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

      if (flagFound && isPoisoned && codeExecuted) {
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
            code: `${file} | UA: ${userAgent}`,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Log poisoning to RCE successful!',
          technique: 'LFI + Log Poisoning',
          hint: 'You poisoned the log file and achieved remote code execution!',
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        isPoisoned,
        codeExecuted,
        message: isPoisoned
          ? 'Log poisoned! Now include the log file to execute code.'
          : 'Page loaded and access logged',
        hint: isPoisoned
          ? `Include log file: /var/log/apache2/access.log`
          : 'Poison logs with: User-Agent: <?php system("cat /flag.txt"); ?>',
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
        message: 'Page load failed',
      };
    }
  }

  /**
   * View access logs
   */
  async getAccessLogs(userId: string, labId: string) {
    const key = `${userId}_${labId}`;
    const logs = this.accessLogs.get(key) || [];

    return {
      success: true,
      logs,
      count: logs.length,
      message: 'Access logs retrieved',
    };
  }
}
