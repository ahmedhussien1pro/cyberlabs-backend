// src/modules/practice-labs/file-upload/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class FileUploadLab2Service {
  private uploadedFiles = new Map<string, { content: string; mime: string }>();

  private readonly ALLOWED_MIMES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];

  private readonly CMD_OUTPUTS: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'cat /var/app/confidential/payroll.txt':
      'PAYROLL Q1 2024\n================\nCEO: $450,000\nCTO: $380,000\nFLAG: FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
    'ls /var/app/confidential': 'payroll.txt\ncontracts.pdf\nemployees.db',
    'ls /uploads': 'report.pdf\nprofile.jpg\nshell.php',
    hostname: 'docuvault-dms-prod',
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
      platform: 'DocuVault Document Management System',
      allowedTypes: this.ALLOWED_MIMES,
      validation: 'Content-Type header check',
      note: 'Only documents with valid MIME types are accepted.',
      uploadEndpoint: 'POST /docs/upload',
    };
  }

  // ❌ الثغرة: يثق في mimeType المرسل من العميل
  async uploadDoc(
    userId: string,
    labId: string,
    filename: string,
    mimeType: string,
    fileContent: string,
  ) {
    if (!filename || !mimeType) {
      throw new BadRequestException('filename and mimeType are required');
    }

    // ❌ الثغرة: يفحص الـ header المرسل من العميل فقط
    const isMimeAllowed = this.ALLOWED_MIMES.includes(mimeType);

    if (!isMimeAllowed) {
      return {
        success: false,
        error: `MIME type '${mimeType}' is not allowed`,
        allowed: this.ALLOWED_MIMES,
        hint: 'MIME type is checked — but it comes from YOUR request. Can you change it?',
      };
    }

    // MIME passed — لكن الملف قد يكون PHP
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const isPhpContent =
      fileContent?.includes('system') || fileContent?.includes('exec');
    const isMimeMismatch = mimeType.startsWith('image/') && ext === 'php';

    this.uploadedFiles.set(filename, {
      content: fileContent ?? '',
      mime: mimeType,
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'MIME_BYPASS',
        meta: { filename, mimeType, ext, isMimeMismatch, isPhpContent },
      },
    });

    return {
      success: true,
      uploaded: true,
      filename,
      mimeAccepted: mimeType,
      url: `/uploads/${filename}`,
      mimeBypass: isMimeMismatch,
      ...(isMimeMismatch && {
        warning: '⚠️ MIME bypass! Content-Type said image but file is PHP.',
        nextStep: `POST /docs/execute with { "filename": "${filename}", "cmd": "cat /var/app/confidential/payroll.txt" }`,
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

    const file = this.uploadedFiles.get(filename);
    if (!file) {
      return {
        success: false,
        error: 'File not uploaded yet',
        hint: 'POST /docs/upload first with mimeType: "image/jpeg" and a .php filename',
      };
    }

    const isExecutable =
      filename.endsWith('.php') || filename.endsWith('.phtml');
    if (!isExecutable) {
      return {
        success: false,
        error: 'File is not executable',
        hint: 'Upload a .php file with mimeType: "image/jpeg" to bypass MIME check',
      };
    }

    const output = this.CMD_OUTPUTS[cmd] ?? `sh: ${cmd}: command simulated`;
    const hasFlag = output.includes('FLAG{');

    return {
      success: true,
      exploited: hasFlag,
      url: `/uploads/${filename}?cmd=${encodeURIComponent(cmd)}`,
      output,
      ...(hasFlag && {
        flag: 'FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
        vulnerability:
          'Unrestricted File Upload — Client-Controlled MIME Type Bypass',
        impact:
          'Attacker uploaded PHP webshell by spoofing Content-Type header. Confidential payroll data and employee records exposed.',
        fix: [
          'Never trust Content-Type header — it is 100% attacker-controlled',
          'Use server-side magic bytes detection (file command / finfo_file())',
          'Whitelist extensions AND validate actual file content',
          'Rename files to UUID with forced extension: uuid + ".jpg"',
          'Store uploads on separate domain with no PHP execution',
        ],
      }),
    };
  }
}
