// src/modules/practice-labs/file-inclusion/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private readonly virtualFS: Record<string, string> = {
    'templates/invoice_basic':
      '<html><body><h1>Invoice #{{id}}</h1><p>Amount: {{amount}}</p></body></html>',
    'templates/invoice_pro':
      '<html><body><h1>Pro Invoice #{{id}}</h1><table>...</table></body></html>',
    'templates/receipt':
      '<html><body><h1>Receipt</h1><p>Thank you for your payment.</p></body></html>',
    '../config/payment.php':
      '<?php\ndefine("STRIPE_PUBLIC_KEY", "pk_live_billpro_abc123");\ndefine("STRIPE_SECRET_KEY", "sk_live_billpro_SECRET_xyz789");\ndefine("PAYPAL_CLIENT_ID", "AYSq3RDGsmBLJE-otTkBtM");\ndefine("PAYPAL_SECRET", "EGnHDxD_qRPbzbImZyK6b");\n// FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}\n$webhook_secret = "whsec_billpro_prod_2024";\n?>',
    '../config/database.php':
      '<?php\ndefine("DB_HOST", "db-billpro-prod.internal");\ndefine("DB_USER", "billpro_admin");\ndefine("DB_PASS", "B1llPr0_DB_S3cr3t!");\ndefine("DB_NAME", "billpro_production");\n?>',
    '/etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nbillpro:x:1001:1001:BillPro Service:/home/billpro:/bin/bash',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async listTemplates(userId: string, labId: string) {
    return {
      success: true,
      templates: [
        'templates/invoice_basic',
        'templates/invoice_pro',
        'templates/receipt',
      ],
      usage:
        'POST /invoice/render with { "file": "templates/invoice_basic", "invoiceId": "INV-001" }',
      note: 'Supported wrappers: standard file paths, php:// streams.',
    };
  }

  // ❌ الثغرة: يقبل php://filter wrapper
  async renderInvoice(
    userId: string,
    labId: string,
    file: string,
    invoiceId: string,
  ) {
    if (!file) throw new BadRequestException('file parameter is required');

    const isWrapper =
      file.startsWith('php://') ||
      file.startsWith('data://') ||
      file.startsWith('zip://');
    const isFilter = file.includes('php://filter');
    const isBase64Filter = isFilter && file.includes('convert.base64-encode');
    const isTraversal = file.includes('../');

    let content = '';
    let isExploited = false;

    if (isBase64Filter) {
      // ❌ الثغرة: محاكاة php://filter/convert.base64-encode/resource=<path>
      const resourceMatch = file.match(/resource=(.+)$/);
      const resourcePath = resourceMatch?.[1] ?? '';
      const rawContent =
        this.virtualFS[resourcePath] ||
        this.virtualFS[resourcePath.replace(/^\.\.\//, '../')] ||
        'File not found';

      content = Buffer.from(rawContent).toString('base64');
      isExploited = rawContent.includes('FLAG{');
    } else if (isWrapper) {
      content = `(PHP wrapper executed: ${file})`;
    } else if (isTraversal) {
      const rawContent = this.virtualFS[file] || 'File not found';
      content = rawContent;
      isExploited = rawContent.includes('FLAG{');
    } else {
      const rawContent = this.virtualFS[file] || 'Template not found';
      content = rawContent
        .replace('{{id}}', invoiceId ?? 'N/A')
        .replace('{{amount}}', '$0.00');
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LFI',
        action: 'PHP_WRAPPER',
        meta: { file, isWrapper, isBase64Filter, isTraversal, isExploited },
      },
    });

    return {
      success: true,
      exploited: isExploited,
      file,
      isBase64Encoded: isBase64Filter,
      content,
      ...(isBase64Filter &&
        !isExploited && {
          hint: 'Base64 encoded file received! Use /utils/decode-base64 to decode it. Try resource=../config/payment.php for payment secrets.',
        }),
      ...(isExploited && {
        flag: 'FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}',
        vulnerability:
          'Local File Inclusion — PHP Stream Wrapper (php://filter)',
        impact:
          'Full PHP source code disclosed including Stripe live keys, PayPal secrets, and webhook secret. Attacker can process fraudulent payments and intercept webhooks.',
        decodedContent: Buffer.from(content, 'base64').toString('utf-8'),
        fix: [
          'Block php:// data:// zip:// and other stream wrappers in file parameters',
          'Whitelist allowed file paths — only permit known template names',
          'Never use user input in include() or file_get_contents() directly',
          'Store sensitive configs in environment variables, not PHP files',
        ],
      }),
    };
  }

  async decodeBase64(userId: string, labId: string, data: string) {
    if (!data) throw new BadRequestException('data is required');
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf-8');
      const hasFlag = decoded.includes('FLAG{');
      return {
        success: true,
        exploited: hasFlag,
        decoded,
        ...(hasFlag && {
          flag: 'FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}',
        }),
      };
    } catch {
      throw new BadRequestException('Invalid base64 data');
    }
  }
}
