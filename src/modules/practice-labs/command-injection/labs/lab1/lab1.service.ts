import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class Lab1Service {
  private readonly FLAG = 'FLAG{CMD_1NJ3CT10N_B4S1C_P1NG}';

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
    };
  }

  async executePing(userId: string, labId: string, ip: string) {
    if (!ip) {
      throw new BadRequestException('IP address is required');
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

    try {
      const command = `ping -c 4 ${ip}`;

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        shell: '/bin/bash',
      });
      const executionTime = Date.now() - startTime;

      const output = stdout || stderr;
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(output);

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

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
            timeTaken: Math.floor(executionTime / 1000),
            code: ip,
          },
        });

        return {
          success: true,
          output,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Command injection successful! Flag captured!',
          executionTime: `${executionTime}ms`,
          hint: 'You successfully exploited OS command injection vulnerability!',
        };
      }

      return {
        success: true,
        output,
        exploited: false,
        executionTime: `${executionTime}ms`,
        message: 'Ping executed. Keep trying to inject commands!',
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
          output: errorOutput,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 Command injection successful via error output!',
        };
      }

      return {
        success: false,
        output: errorOutput,
        exploited: false,
        message: 'Command execution failed. Check your syntax.',
      };
    }
  }
}
