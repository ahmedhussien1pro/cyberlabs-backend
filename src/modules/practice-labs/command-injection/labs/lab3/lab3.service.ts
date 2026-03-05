// src/modules/practice-labs/command-injection/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private readonly systemFiles: Record<string, string> = {
    '/var/secrets/db.conf':
      '# Production Database Config\nDB_HOST=prod-db-01.internal\nDB_USER=logvault_admin\nDB_PASS=Pr0d_DB_S3cr3t_2024!\nDB_NAME=logvault_prod\nFLAG=FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
    '/etc/shadow':
      'root:$6$xyz$hashedpassword:19000:0:99999:7:::\nlogvault:$6$abc$anotherhash:19000:0:99999:7:::',
    '/etc/hostname': 'logvault-prod-03',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async listLogs(userId: string, labId: string) {
    return {
      success: true,
      logs: [
        { filename: 'access.log', size: '2.3MB', errors: 42 },
        { filename: 'error.log', size: '512KB', errors: 189 },
        { filename: 'auth.log', size: '1.1MB', errors: 7 },
      ],
      usage:
        'POST /logs/upload with { "filename": "yourfile.log", "content": "..." }',
      note: 'Upload a log file to count ERROR occurrences.',
    };
  }

  // ❌ الثغرة: filename يُستخدم في shell command بدون sanitization
  async uploadLog(
    userId: string,
    labId: string,
    filename: string,
    content: string,
  ) {
    if (!filename) throw new BadRequestException('filename is required');

    // تحديد نوع الحقن
    const hasSemicolon = /;/.test(filename);
    const hasSubshell = /\$\(/.test(filename) || /`/.test(filename);
    const hasPipe = /\|/.test(filename);
    const isInjected = hasSemicolon || hasSubshell || hasPipe;

    // محاكاة: grep ERROR /uploads/<filename> | wc -l
    const simulatedCmd = `grep ERROR /uploads/${filename} | wc -l`;
    let errorCount = Math.floor(Math.random() * 200);
    let injectedOutput = '';

    if (isInjected) {
      injectedOutput = this.resolveInjection(filename);
    }

    const hasFlag = injectedOutput.includes('FLAG{');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'FILENAME_INJECTION',
        meta: {
          filename,
          isInjected,
          hasSemicolon,
          hasSubshell,
          injectedOutput: injectedOutput.substring(0, 200),
        },
      },
    });

    if (isInjected) {
      return {
        success: true,
        exploited: hasFlag,
        simulatedCommand: simulatedCmd,
        errorCount,
        injectedCommandOutput: injectedOutput,
        ...(hasFlag && {
          flag: 'FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
          vulnerability: 'Command Injection via Malicious Filename',
          impact:
            'Production DB credentials exposed: host, user, password, DB name — full database compromise.',
          fix: [
            'Sanitize filenames: allow only [a-zA-Z0-9._-] characters',
            'Use path.basename() to strip directory traversal',
            'Never use filenames in shell commands — use file descriptors instead',
            'Store uploaded files with server-generated UUID names, not user-provided names',
          ],
        }),
        hint: !hasFlag
          ? 'Injection detected! Try reading sensitive files: filename: "access.log; cat /var/secrets/db.conf"'
          : undefined,
      };
    }

    return {
      success: true,
      exploited: false,
      filename,
      errorCount,
      message: `Processed ${filename}: found ${errorCount} ERROR entries`,
      hint: 'Try using shell metacharacters in the filename: ; | $() `',
    };
  }

  private resolveInjection(filename: string): string {
    // محاكاة subshell $()
    if (/\$\(cat\s+([\S]+)\)/.test(filename)) {
      const match = filename.match(/\$\(cat\s+([\S]+)\)/);
      const path = match?.[1] || '';
      return this.systemFiles[path] || 'File not found';
    }

    // محاكاة semicolon injection
    if (/;\s*cat\s+([\S]+)/.test(filename)) {
      const match = filename.match(/;\s*cat\s+([\S]+)/);
      const path = match?.[1] || '';
      return this.systemFiles[path] || 'File not found';
    }

    // محاكاة whoami
    if (/\$\(whoami\)/.test(filename) || /;\s*whoami/.test(filename)) {
      return 'www-data';
    }

    return '(injected command executed — no output captured)';
  }
}
