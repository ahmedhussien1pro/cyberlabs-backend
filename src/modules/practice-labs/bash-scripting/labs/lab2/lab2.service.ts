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

  async getChallenge(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    // توليد الفلاج الديناميك
    const dynamicFlag = this.stateService.generateDynamicFlag(
      'FLAG{BASH_LAB2_LOG_ANALYSIS',
      userId,
      resolvedLabId,
    );

    const logContent = [
      '2026-03-17 00:01:12 INFO  user=alice action=login ip=192.168.1.10',
      '2026-03-17 00:01:45 INFO  user=bob action=login ip=10.0.0.5',
      '2026-03-17 00:02:10 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:11 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:12 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:13 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:14 WARN  user=bob action=failed_login ip=10.0.0.5',
      `2026-03-17 00:03:00 ERROR user=admin action=secret_access flag=${dynamicFlag}`,
      '2026-03-17 00:03:45 INFO  user=alice action=logout ip=192.168.1.10',
    ].join('\n');

    return {
      challenge: {
        logFile: logContent,
        task: 'Analyze this log file. Find the hidden flag using grep or awk.',
        hint: 'Use: grep "FLAG" on the log content',
      },
      instructions:
        'Analyze the log file above. Find the line containing the flag. Submit as FLAG{...}.',
    };
  }

  async runCommand(userId: string, labId: string, cmd: string): Promise<{ output: string }> {
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    const dynamicFlag = this.stateService.generateDynamicFlag(
      'FLAG{BASH_LAB2_LOG_ANALYSIS',
      userId,
      resolvedLabId,
    );

    const logLines = [
      '2026-03-17 00:01:12 INFO  user=alice action=login ip=192.168.1.10',
      '2026-03-17 00:01:45 INFO  user=bob action=login ip=10.0.0.5',
      '2026-03-17 00:02:10 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:11 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:12 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:13 WARN  user=bob action=failed_login ip=10.0.0.5',
      '2026-03-17 00:02:14 WARN  user=bob action=failed_login ip=10.0.0.5',
      `2026-03-17 00:03:00 ERROR user=admin action=secret_access flag=${dynamicFlag}`,
      '2026-03-17 00:03:45 INFO  user=alice action=logout ip=192.168.1.10',
    ];

    const trimmed = cmd.trim();

    // محاكاة أوامر bash على الـ log
    if (trimmed === 'cat /var/log/access.log' || trimmed === 'cat access.log') {
      return { output: logLines.join('\n') };
    }
    if (trimmed.startsWith('grep')) {
      const matchArg = trimmed.match(/grep\s+['"]?([^'"\s]+)['"]?/);
      const pattern = matchArg?.[1] ?? '';
      const matched = logLines.filter((l) => l.includes(pattern));
      return { output: matched.length ? matched.join('\n') : '(no output)' };
    }
    if (trimmed.startsWith('awk')) {
      // awk '/FLAG/{print}'
      if (trimmed.includes('FLAG')) {
        const matched = logLines.filter((l) => l.includes('FLAG'));
        return { output: matched.length ? matched.join('\n') : '(no output)' };
      }
      // awk '{print $1}' → طباعة أول field
      const fieldMatch = trimmed.match(/\$([0-9]+)/);
      const fieldIdx = fieldMatch ? parseInt(fieldMatch[1], 10) - 1 : 0;
      const out = logLines.map((l) => l.split(/\s+/)[fieldIdx] ?? '').join('\n');
      return { output: out || '(no output)' };
    }
    if (trimmed.startsWith('cut')) {
      const fMatch = trimmed.match(/-f(\d+)/);
      const dMatch = trimmed.match(/-d["']?([^"'\s]+)/);
      const delim = dMatch?.[1] ?? '\t';
      const fieldNum = fMatch ? parseInt(fMatch[1], 10) - 1 : 0;
      const out = logLines.map((l) => l.split(delim)[fieldNum] ?? '').join('\n');
      return { output: out || '(no output)' };
    }
    if (trimmed === 'ls' || trimmed === 'ls /var/log/') {
      return { output: 'access.log' };
    }
    if (trimmed === 'help') {
      return {
        output: [
          'Available commands:',
          '  cat /var/log/access.log  — view full log',
          '  grep "PATTERN" access.log — filter lines',
          '  awk "/FLAG/{print}" access.log — extract flag lines',
          '  cut -d" " -f1 access.log — extract first field',
          '  ls /var/log/ — list files',
        ].join('\n'),
      };
    }

    return { output: `bash: ${trimmed.split(' ')[0]}: command simulated — no output` };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);

    const isCorrect = this.stateService.verifyDynamicFlag(
      'FLAG{BASH_LAB2_LOG_ANALYSIS',
      userId,
      resolvedLabId,
      submittedFlag,
    );

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Try using grep "FLAG" on the log file.',
      };
    }

    const dynamicFlag = this.stateService.generateDynamicFlag(
      'FLAG{BASH_LAB2_LOG_ANALYSIS',
      userId,
      resolvedLabId,
    );

    return {
      success: true,
      flag: dynamicFlag,
      message: 'Correct! You found the hidden flag in the log file.',
      solution: 'grep "FLAG" access.log  OR  awk "/FLAG/{print}" access.log',
      explanation:
        'Log analysis is a critical skill in security. Tools like grep, awk, and sed ' +
        'allow you to quickly search through thousands of log lines to find anomalies or hidden data.',
    };
  }
}
