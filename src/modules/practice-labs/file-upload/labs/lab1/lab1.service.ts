// src/modules/practice-labs/file-upload/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class FileUploadLab1Service {
  private uploadedFiles = new Map<
    string,
    { phpCode: string; bypassed: boolean }
  >();

  // امتدادات محظورة — blacklist ناقصة
  private readonly BLACKLIST = ['.php', '.asp', '.jsp', '.exe', '.sh'];

  // امتدادات تنجح في التجاوز
  private readonly BYPASS_EXTENSIONS = [
    '.php.jpg',
    '.php.png',
    '.php.gif',
    '.PHP',
    '.Php',
    '.pHp',
    '.php5',
    '.php7',
    '.phtml',
    '.phar',
    '.php%00.jpg',
  ];

  private readonly CMD_OUTPUTS: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'cat /app/flag.txt':
      'FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
    'ls /app': 'flag.txt\nconfig.php\nuploads\nindex.php',
    hostname: 'socialhub-prod-01',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.uploadedFiles.clear();
    return this.stateService.initializeState(userId, labId);
  }

  async getInfo(userId: string, labId: string) {
    return {
      success: true,
      platform: 'SocialHub Profile System',
      uploadEndpoint: 'POST /profile/avatar/upload',
      allowedTypes: 'Images only (jpg, png, gif)',
      validation: 'Extension blacklist check',
      blacklist: this.BLACKLIST,
      maxSize: '5MB',
      storageUrl: '/uploads/avatars/<filename>',
    };
  }

  // ❌ الثغرة: blacklist فقط — سهل التجاوز
  async uploadAvatar(
    userId: string,
    labId: string,
    filename: string,
    phpCode: string,
    mimeType: string,
  ) {
    if (!filename) throw new BadRequestException('filename is required');

    const ext = this.getLastExtension(filename);
    const isBlocked = this.BLACKLIST.includes(ext.toLowerCase());
    const isBypassed = this.BYPASS_EXTENSIONS.some(
      (b) =>
        filename.toLowerCase().endsWith(b.toLowerCase()) ||
        filename.endsWith(b),
    );

    if (isBlocked && !isBypassed) {
      return {
        success: false,
        error: `File type '${ext}' is not allowed`,
        blocked: true,
        hint: 'Blacklist blocks .php — but what about .php.jpg, .PHP, .phtml?',
      };
    }

    const hasPhpCode =
      phpCode &&
      (phpCode.includes('system') ||
        phpCode.includes('exec') ||
        phpCode.includes('passthru'));

    this.uploadedFiles.set(filename, {
      phpCode: phpCode ?? '',
      bypassed: isBypassed || !isBlocked,
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'AVATAR_UPLOAD',
        meta: { filename, ext, isBlocked, isBypassed, hasPhpCode },
      },
    });

    return {
      success: true,
      uploaded: true,
      filename,
      url: `/uploads/avatars/${filename}`,
      bypassDetected: isBypassed,
      ...(isBypassed && {
        warning: '⚠️ Extension bypass detected! File saved with original name.',
        message: `File "${filename}" uploaded successfully. Extension check bypassed!`,
        nextStep: `POST /profile/avatar/execute with { "filename": "${filename}", "cmd": "cat /app/flag.txt" }`,
      }),
      ...(!isBypassed && {
        message: 'Avatar uploaded successfully.',
      }),
    };
  }

  async executeWebshell(
    userId: string,
    labId: string,
    filename: string,
    cmd: string,
  ) {
    if (!filename || !cmd) {
      throw new BadRequestException('filename and cmd are required');
    }

    const uploadedFile = this.uploadedFiles.get(filename);

    if (!uploadedFile) {
      return {
        success: false,
        error: 'File not found — upload it first via /profile/avatar/upload',
      };
    }

    const isBypassed = uploadedFile.bypassed;
    const isPhpFile = this.BYPASS_EXTENSIONS.some(
      (b) => filename.toLowerCase().includes('.php') || filename.endsWith(b),
    );

    if (!isBypassed && !isPhpFile) {
      return {
        success: false,
        error: 'File is not executable — not a PHP bypass',
        hint: 'Upload a file with .php.jpg, .phtml, or .PHP extension first',
      };
    }

    const output = this.CMD_OUTPUTS[cmd] ?? `sh: ${cmd}: command simulated`;
    const hasFlag = output.includes('FLAG{');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'WEBSHELL_EXEC',
        meta: { filename, cmd, hasFlag },
      },
    });

    return {
      success: true,
      exploited: hasFlag,
      url: `/uploads/avatars/${filename}?cmd=${cmd}`,
      output,
      ...(hasFlag && {
        flag: 'FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
        vulnerability: 'Unrestricted File Upload — Blacklist Extension Bypass',
        bypassUsed: this.identifyBypassType(filename),
        impact:
          'Attacker uploaded a PHP webshell. Full RCE achieved on web server.',
        fix: [
          'Use WHITELIST not blacklist: only allow [jpg, png, gif] explicitly',
          'Rename uploaded files to random UUID — never use original filename',
          'Store uploads outside webroot — serve via controlled endpoint',
          'Validate MIME type AND magic bytes, not just extension',
          'Run file through antivirus scanner before storing',
        ],
      }),
    };
  }

  private getLastExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  }

  private identifyBypassType(filename: string): string {
    if (filename.includes('.php.')) return 'Double Extension (.php.jpg)';
    if (/\.PHP$/i.test(filename) && !/\.php$/.test(filename))
      return 'Case Manipulation (.PHP)';
    if (filename.endsWith('.phtml'))
      return 'Alternative PHP Extension (.phtml)';
    if (filename.endsWith('.php5')) return 'Alternative PHP Extension (.php5)';
    if (filename.endsWith('.phar')) return 'PHAR Extension (.phar)';
    return 'Extension Bypass';
  }
}
