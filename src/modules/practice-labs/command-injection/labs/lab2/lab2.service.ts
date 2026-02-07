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
export class Lab2Service {
  private readonly FLAG = 'FLAG{BL1ND_CMD_1NJ3CT10N_T1M3_B4S3D}';
  private readonly OUTPUT_DIR = '/tmp/lab2_outputs';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {
    this.initOutputDir();
  }

  private async initOutputDir() {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
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

    const outputFile = `${this.OUTPUT_DIR}/${userId}_${labId}.txt`;
    let outputContent: string | null = null; // ✅ Fix: Proper type

    try {
      outputContent = await fs.readFile(outputFile, 'utf-8');
    } catch (error) {
      // File doesn't exist yet
    }

    return {
      success: true,
      state: instance.state,
      isActive: instance.isActive,
      startedAt: instance.startedAt,
      outputFile: outputContent ? outputFile : null,
      outputContent,
    };
  }

  async checkServerStatus(userId: string, labId: string, server: string) {
    if (!server) {
      throw new BadRequestException('Server address is required');
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
      const command = `curl -s --max-time 2 ${server} > /dev/null 2>&1 && echo "online" || echo "offline"`;

      const startTime = Date.now();
      const { stdout } = await execAsync(command, {
        timeout: 15000,
        shell: '/bin/bash',
      });
      const responseTime = Date.now() - startTime;

      const status = stdout.trim() === 'online' ? 'online' : 'offline';

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      const outputFile = `${this.OUTPUT_DIR}/${userId}_${labId}.txt`;
      let flagFound = false;

      try {
        const fileContent = await fs.readFile(outputFile, 'utf-8');
        const flagPattern = new RegExp(this.FLAG);
        flagFound = flagPattern.test(fileContent);

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
              timeTaken: Math.floor(responseTime / 1000),
              code: server,
            },
          });

          return {
            success: true,
            server,
            status,
            responseTime: `${responseTime}ms`,
            exploited: true,
            flag: this.FLAG,
            message:
              '🎉 Blind command injection successful! Flag found in output file!',
            outputFile,
            hint: 'You successfully used output redirection to exfiltrate data!',
          };
        }
      } catch (error) {
        // Output file doesn't exist or couldn't be read
      }

      const timeTookLong = responseTime > 4000;

      return {
        success: true,
        server,
        status,
        responseTime: `${responseTime}ms`,
        exploited: false,
        message: timeTookLong
          ? 'Unusual delay detected. Time-based injection working! Try extracting data.'
          : 'Server status checked. Try time-based or out-of-band techniques.',
        hint: timeTookLong
          ? 'Time delay confirmed! Now use output redirection: & cat /flag.txt > /tmp/lab2_outputs/' +
            userId +
            '_' +
            labId +
            '.txt &'
          : 'Try: example.com & sleep 5 & to verify injection',
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
        server,
        status: 'error',
        responseTime: '0ms',
        message: 'Status check failed',
        error: error.message,
      };
    }
  }

  async readOutputFile(userId: string, labId: string) {
    const outputFile = `${this.OUTPUT_DIR}/${userId}_${labId}.txt`;

    try {
      const content = await fs.readFile(outputFile, 'utf-8');
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      return {
        success: true,
        content,
        flagFound,
        message: flagFound
          ? '🎉 Flag found in output file!'
          : 'Output file read successfully',
      };
    } catch (error) {
      throw new NotFoundException(
        'Output file not found. Try redirecting command output first.',
      );
    }
  }
}
