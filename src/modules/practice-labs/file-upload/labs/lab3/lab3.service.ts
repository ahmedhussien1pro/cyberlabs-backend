// src/modules/practice-labs/file-upload/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class FileUploadLab3Service {
  private uploadedFiles = new Map<
    string,
    { payload: string; bypassed: boolean }
  >();

  // JPEG magic bytes
  private readonly JPEG_MAGIC = 'FFD8FFE0';

  private readonly MAGIC_BYTES_TABLE: Record<string, string> = {
    FFD8FFE0: 'JPEG Image',
    FFD8FFE1: 'JPEG (EXIF)',
    '89504E47': 'PNG Image',
    '47494638': 'GIF Image',
    '25504446': 'PDF Document',
    '504B0304': 'ZIP Archive',
    '3C3F7068': 'PHP File (<?ph)',
  };

  private readonly CMD_OUTPUTS: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'cat /etc/pacs/patient_db.conf':
      'PACS_DB_HOST=pacs-db-prod.internal\nPACS_DB_USER=mediscan_admin\nPACS_DB_PASS=M3d1Sc4n_DB_Pr0d!\nENCRYPTION_KEY=aes256_pacs_master\nFLAG=FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
    'ls /uploads/scans': 'CT_20240301_001.dcm\nMRI_20240301_002.dcm\nscan.php',
    'ls /etc/pacs': 'patient_db.conf\npacs.conf\ndicom.conf',
    hostname: 'mediscan-pacs-prod',
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
      platform: 'MediScan PACS — Medical Imaging System',
      validation: 'Magic bytes check (first 4 bytes of file)',
      required: 'JPEG only — magic bytes must be FFD8FFE0',
      magicTable: this.MAGIC_BYTES_TABLE,
      note: 'Submit magic bytes in hex format with your file content.',
    };
  }

  // ❌ الثغرة: يفحص magic bytes فقط — لا يفحص باقي المحتوى
  async uploadScan(
    userId: string,
    labId: string,
    filename: string,
    magicBytes: string,
    phpPayload: string,
  ) {
    if (!filename || !magicBytes) {
      throw new BadRequestException('filename and magicBytes are required');
    }

    const normalizedMagic = magicBytes.toUpperCase().replace(/\s/g, '');
    const isMagicValid =
      normalizedMagic === this.JPEG_MAGIC ||
      normalizedMagic.startsWith(this.JPEG_MAGIC);

    if (!isMagicValid) {
      return {
        success: false,
        error: 'Invalid file format. Only JPEG images are accepted.',
        received: normalizedMagic,
        expected: this.JPEG_MAGIC,
        hint: 'Magic bytes must start with FFD8FFE0 (JPEG). But what if you ADD that prefix to a PHP file?',
        magicTable: this.MAGIC_BYTES_TABLE,
      };
    }

    // ✅ Magic bytes check passed — لكن الملف قد يكون PHP!
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const isPhp = ext === 'php' || ext === 'phtml' || ext === 'php5';
    const hasPayload = !!phpPayload;
    const isBypassed = isMagicValid && isPhp;

    this.uploadedFiles.set(filename, {
      payload: phpPayload ?? '',
      bypassed: isBypassed,
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'MAGIC_BYTES_BYPASS',
        meta: { filename, normalizedMagic, isPhp, isBypassed, hasPayload },
      },
    });

    return {
      success: true,
      uploaded: true,
      filename,
      magicVerified: true,
      detectedAs:
        this.MAGIC_BYTES_TABLE[
          normalizedMagic.slice(0, 8) as keyof typeof this.MAGIC_BYTES_TABLE
        ] ?? 'Unknown',
      url: `/uploads/scans/${filename}`,
      polyglot: isBypassed,
      ...(isBypassed && {
        warning:
          '⚠️ Polyglot file! Magic bytes say JPEG — but file extension is PHP.',
        explanation:
          'PHP ignores binary content before <?php tag. JPEG magic bytes pass the check.',
        nextStep: `POST /scan/execute with { "filename": "${filename}", "cmd": "cat /etc/pacs/patient_db.conf" }`,
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
        error: 'File not found',
        hint: 'Upload a polyglot file first: JPEG magic bytes + PHP extension',
      };
    }

    const isPhp = filename.endsWith('.php') || filename.endsWith('.phtml');
    if (!isPhp || !file.bypassed) {
      return {
        success: false,
        error: 'Not a PHP polyglot file',
        hint: 'Upload filename.php with magicBytes: "FFD8FFE0" to create polyglot',
      };
    }

    const output = this.CMD_OUTPUTS[cmd] ?? `sh: ${cmd}: command simulated`;
    const hasFlag = output.includes('FLAG{');

    return {
      success: true,
      exploited: hasFlag,
      url: `/uploads/scans/${filename}?cmd=${encodeURIComponent(cmd)}`,
      output,
      ...(hasFlag && {
        flag: 'FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
        vulnerability:
          'Unrestricted File Upload — Magic Bytes Bypass (Polyglot File)',
        polyglotExplained: [
          'File starts with FF D8 FF E0 → magic bytes validator sees "JPEG"',
          'File extension is .php → Apache/Nginx routes to PHP interpreter',
          'PHP parser ignores binary garbage before <?php tag',
          'PHP executes the webshell → full RCE achieved',
        ],
        impact:
          'Medical PACS system compromised. Patient database credentials exposed. HIPAA violation.',
        fix: [
          'Check BOTH magic bytes AND extension — they must match',
          'Re-encode/re-compress images server-side using GD/ImageMagick — destroys PHP code',
          'Serve images from a static CDN with no PHP execution',
          'Rename to UUID + force image extension after re-encoding',
          'Use dedicated file analysis library (e.g., Apache Tika)',
        ],
      }),
    };
  }
}
