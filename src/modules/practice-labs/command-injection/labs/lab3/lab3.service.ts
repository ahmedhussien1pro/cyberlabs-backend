import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class Lab3Service {
  private readonly FLAG = 'FLAG{H34D3R_CMD_1NJ3CT10N_US3R_4G3NT}';
  private readonly LOG_DIR = '/tmp/lab3_logs';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {
    this.initLogDir();
  }

  private async initLogDir() {
    try {
      await fs.mkdir(this.LOG_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

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

    const logFile = `${this.LOG_DIR}/${userId}_${labId}.log`;
    let logs: string[] = []; // ✅ Fix: Proper type

    try {
      const content = await fs.readFile(logFile, 'utf-8');
      logs = content.split('\n').filter(Boolean).slice(-10);
    } catch (error) {
      // Log file doesn't exist yet
    }

    return {
      success: true,
      state: instance.state,
      isActive: instance.isActive,
      startedAt: instance.startedAt,
      recentLogs: logs,
    };
  }

  async logRequest(
    userId: string,
    labId: string,
    userAgent: string,
    ipAddress?: string,
  ) {
    if (!userAgent) {
      throw new BadRequestException('User-Agent header is required');
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

    // ✅ Fix: Check if progress exists
    if (!progress) {
      throw new NotFoundException(
        'Lab progress not found. Please start the lab first.',
      );
    }

    const timestamp = new Date().toISOString();
    const logId = Math.random().toString(36).substring(7);
    const logFile = `${this.LOG_DIR}/${userId}_${labId}.log`;

    try {
      const command = `echo "[${timestamp}] IP: ${ipAddress || 'unknown'} | User-Agent: ${userAgent}" >> ${logFile}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 5000,
        shell: '/bin/bash',
      });

      const commandOutput = stdout || stderr;

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      const logContent = await fs.readFile(logFile, 'utf-8');
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(logContent);
      const flagInOutput = flagPattern.test(commandOutput);

      if (flagFound || flagInOutput) {
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
            code: userAgent,
          },
        });

        return {
          success: true,
          logId,
          timestamp,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Header command injection successful! Flag captured!',
          hint: 'You successfully exploited command injection via User-Agent header!',
          output: commandOutput || logContent,
        };
      }

      return {
        success: true,
        logId,
        timestamp,
        message: 'Request logged successfully',
        hint: 'Try injecting commands using backticks (`) or $()',
      };
    } catch (error) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      const errorOutput = error.stdout || error.stderr || error.message;
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(errorOutput);

      if (flagFound) {
        await this.prisma.userLabProgress.update({
          where: { id: progress.id },
          data: {
            flagSubmitted: true,
            completedAt: new Date(),
            progress: 100,
          },
        });

        return {
          success: true,
          logId,
          timestamp,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Command injection successful via error output!',
          output: errorOutput,
        };
      }

      return {
        success: false,
        message: 'Failed to log request',
        error: errorOutput,
        hint: 'Check your injection syntax. Try: Mozilla/5.0 `whoami`',
      };
    }
  }

  async viewLogs(userId: string, labId: string) {
    const logFile = `${this.LOG_DIR}/${userId}_${labId}.log`;

    try {
      const content = await fs.readFile(logFile, 'utf-8');
      const logs = content.split('\n').filter(Boolean);
      const recentLogs = logs.slice(-20);

      const flagPattern = new RegExp(this.FLAG);
      const flagFound = recentLogs.some((log) => flagPattern.test(log));

      return {
        success: true,
        logs: recentLogs,
        totalLogs: logs.length,
        flagFound,
        message: flagFound
          ? '🎉 Flag found in logs!'
          : 'Logs retrieved successfully',
      };
    } catch (error) {
      throw new NotFoundException(
        'No logs found yet. Make some requests first.',
      );
    }
  }

  // ✅ Add missing method for controller
  validateFlag(flag: string): boolean {
    return flag === this.FLAG;
  }
}
