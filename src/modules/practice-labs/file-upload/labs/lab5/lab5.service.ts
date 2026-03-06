// src/modules/practice-labs/file-upload/labs/lab5/lab5.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class FileUploadLab5Service {
  private extractedFiles = new Map<string, string>();
  private backdoorDropped = false;
  private zipSlipPaths: string[] = [];

  private readonly BASE_DIR = '/var/backups/';
  private readonly WEB_ROOT = '/var/www/html/';

  private readonly CMD_OUTPUTS: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'cat /app/secrets/master_backup.key':
      '# BackupHub Master Secrets\nBACKUP_ENCRYPTION_KEY=AES256_BackupHub_Master_2024!\nS3_BUCKET=backuphub-prod-encrypted\nS3_ACCESS_KEY=AKIA_BACKUPHUB_PROD\nS3_SECRET=wJalrX_BackupHub_Secret\nFLAG=FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
    'ls /var/www/html': 'index.php\napi.php\nconfig.php\nbackdoor.php\nuploads',
    'ls /app/secrets': 'master_backup.key\ndb.key\naws.key',
    'cat /var/www/html/config.php':
      '<?php\n$db_pass = "BackupHub_DB_2024!";\n$admin_token = "tok_admin_backuphub_xyz";\n?>',
    hostname: 'backuphub-devops-prod',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.extractedFiles.clear();
    this.backdoorDropped = false;
    this.zipSlipPaths = [];
    return this.stateService.initializeState(userId, labId);
  }

  async getInfo(userId: string, labId: string) {
    return {
      success: true,
      platform: 'BackupHub DevOps Backup Manager',
      extractTo: this.BASE_DIR,
      validation: 'ZIP entries extracted directly without path normalization',
      warning: 'ZIP entry names are used as-is in path.join()',
      usage:
        'POST /backup/upload with { "zipEntries": [{ "name": "file.txt", "content": "..." }] }',
    };
  }

  // ❌ الثغرة: ZIP Slip — لا يتحقق من المسارات
  async uploadAndExtract(
    userId: string,
    labId: string,
    zipName: string,
    zipEntries: Array<{ name: string; content: string }>,
  ) {
    if (!zipEntries?.length) {
      throw new BadRequestException('zipEntries array is required');
    }

    const extractionResults: Array<{
      entryName: string;
      resolvedPath: string;
      isSlip: boolean;
      isWebRoot: boolean;
    }> = [];

    for (const entry of zipEntries) {
      if (!entry.name) continue;

      // ❌ الثغرة: path join بدون normalization
      const resolvedPath = this.unsafeJoin(this.BASE_DIR, entry.name);
      const isSlip = !resolvedPath.startsWith(this.BASE_DIR);
      const isWebRoot = resolvedPath.startsWith(this.WEB_ROOT);

      this.extractedFiles.set(resolvedPath, entry.content ?? '');

      if (
        isWebRoot &&
        (entry.name.endsWith('.php') || entry.content?.includes('system'))
      ) {
        this.backdoorDropped = true;
        this.zipSlipPaths.push(resolvedPath);
      }

      extractionResults.push({
        entryName: entry.name,
        resolvedPath,
        isSlip,
        isWebRoot,
      });
    }

    const hasSlip = extractionResults.some((r) => r.isSlip);
    const hasWebRoot = extractionResults.some((r) => r.isWebRoot);

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'ZIP_SLIP',
        meta: {
          zipName,
          totalEntries: zipEntries.length,
          slipCount: extractionResults.filter((r) => r.isSlip).length,
          backdoorDropped: this.backdoorDropped,
          slipPaths: this.zipSlipPaths,
        },
      },
    });

    return {
      success: true,
      extracted: extractionResults.length,
      results: extractionResults,
      hasZipSlip: hasSlip,
      ...(hasWebRoot &&
        this.backdoorDropped && {
          warning:
            '⚠️ ZIP Slip! File written outside /var/backups/ into web root!',
          droppedAt: this.zipSlipPaths,
          nextStep:
            'POST /backup/backdoor-exec with { "cmd": "cat /app/secrets/master_backup.key" }',
          attackChain: [
            '1. ZIP entry name contained "../" path traversal',
            `2. Server joined: ${this.BASE_DIR} + entry.name without normalization`,
            '3. File written to /var/www/html/ (web root)',
            '4. Backdoor accessible via web server → RCE achieved',
          ],
        }),
      ...(!hasSlip && {
        hint: 'No ZIP Slip detected. Try entry names like: "../../var/www/html/backdoor.php"',
      }),
    };
  }

  async listExtracted(userId: string, labId: string) {
    const files = Array.from(this.extractedFiles.entries()).map(
      ([path, content]) => ({
        path,
        size: content.length,
        isOutsideBase: !path.startsWith(this.BASE_DIR),
        isInWebRoot: path.startsWith(this.WEB_ROOT),
      }),
    );

    return {
      success: true,
      backdoorDropped: this.backdoorDropped,
      totalExtracted: files.length,
      zipSlipFiles: files.filter((f) => f.isOutsideBase),
      allFiles: files,
    };
  }

  async backdoorExec(userId: string, labId: string, cmd: string) {
    if (!this.backdoorDropped) {
      return {
        success: false,
        error: 'No backdoor deployed yet',
        hint: 'Upload a ZIP with entry name "../../var/www/html/backdoor.php" containing PHP code',
      };
    }

    if (!cmd) throw new BadRequestException('cmd is required');

    const output = this.CMD_OUTPUTS[cmd] ?? `sh: ${cmd}: command simulated`;
    const hasFlag = output.includes('FLAG{');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'ZIP_SLIP_BACKDOOR_EXEC',
        meta: { cmd, hasFlag, backdoorPath: this.zipSlipPaths[0] },
      },
    });

    return {
      success: true,
      exploited: hasFlag,
      backdoor: `${this.WEB_ROOT}backdoor.php`,
      cmd,
      output,
      ...(hasFlag && {
        flag: 'FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
        vulnerability:
          'ZIP Slip — Arbitrary File Write via Path Traversal in ZIP Entry Names',
        fullChain: [
          '1. Crafted ZIP archive with entry named "../../var/www/html/backdoor.php"',
          '2. Server extracted without path.normalize() or boundary check',
          '3. Backdoor written to /var/www/html/ (web root)',
          '4. HTTP request to /backdoor.php → PHP executed → RCE',
          '5. Read /app/secrets/master_backup.key → S3 keys + encryption key + FLAG',
        ],
        impact:
          'Full server compromise. Backup encryption keys and AWS S3 credentials exposed. All backups can be decrypted.',
        fix: [
          'Normalize entry paths: const safe = path.normalize(path.join(base, entry)); if (!safe.startsWith(base)) throw',
          'Use trusted ZIP libraries with built-in slip protection',
          'Extract to a temp directory, validate all paths, then move safe files',
          'Run extraction in a sandboxed container with read-only filesystem',
          'Scan extracted content with antivirus before making accessible',
        ],
      }),
    };
  }

  // ❌ الثغرة: unsafeJoin — لا يمنع traversal
  private unsafeJoin(base: string, entryName: string): string {
    const parts = (base + entryName).split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') resolved.pop();
      else if (part !== '.') resolved.push(part);
    }
    return '/' + resolved.join('/');
  }
}
