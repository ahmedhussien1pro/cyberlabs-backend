// src/modules/practice-labs/bash-scripting/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  // Log analysis challenge
  async getChallenge(userId: string, labId: string) {
    const logContent = [
      '2026-03-17 00:01:12 INFO  user=alice action=login ip=192.168.1.10',
      '2026-03-17 00:01:45 INFO  user=bob action=login ip=10.0.0.5',
      '2026-03-17 00:02:10 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:11 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:12 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:13 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:14 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:03:00 ERROR user=admin action=secret_access flag=FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
      '2026-03-17 00:03:45 INFO  user=alice action=logout ip=192.168.1.10',
    ].join('\n');

    return {
      challenge: {
        logFile: logContent,
        task: 'Analyze this log file. Find the hidden flag using grep or awk.',
        hint: 'The flag is hidden inside one of the log lines. Use: grep "FLAG" log.txt',
      },
      instructions:
        'Analyze the log file above. Find the line containing the flag. Submit as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{BASH_LOG_ANALYSIS_GREP_AWK}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Try using grep "FLAG" on the log file.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Correct! You found the hidden flag in the log file.',
      solution: 'grep "FLAG" log.txt  OR  awk "/FLAG/{print}" log.txt',
      explanation:
        'Log analysis is a critical skill in security. Tools like grep, awk, and sed ' +
        'allow you to quickly search through thousands of log lines to find anomalies or hidden data.',
    };
  }
}
