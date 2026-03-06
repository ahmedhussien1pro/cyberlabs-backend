// src/modules/practice-labs/file-inclusion/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab2Metadata: LabMetadata = {
  slug: 'lfi-php-wrapper-filter-invoice-generator',
  title:
    'File Inclusion: PHP Stream Wrappers — Invoice Generator Source Disclosure',
  ar_title: 'تضمين الملفات: PHP Stream Wrappers — كشف مصدر مولّد الفواتير',
  description:
    'Exploit LFI with PHP stream wrappers in an invoice generation system. Use php://filter/convert.base64-encode/resource= to read PHP source files as base64 — bypassing any PHP execution and revealing application source code with hardcoded secrets.',
  ar_description:
    'استغل LFI مع PHP stream wrappers في نظام توليد فواتير. استخدم php://filter/convert.base64-encode/resource= لقراءة ملفات PHP المصدرية بصيغة base64 — تجاوز تنفيذ PHP وكشف كود المصدر مع الأسرار المضمّنة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Local File Inclusion',
    'PHP Stream Wrappers',
    'Source Code Disclosure',
    'php://filter',
    'Base64 Encoding Bypass',
  ],
  xpReward: 250,
  pointsReward: 125,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The invoice system loads templates via a file parameter. Use php://filter/convert.base64-encode/resource=../config/payment.php to read the payment gateway source file as base64. Decode it to find the Stripe secret key and the flag.',
  scenario: {
    context:
      'BillPro invoice generator loads invoice templates dynamically. The file parameter accepts filenames that are included via PHP include(). By using the php://filter wrapper with convert.base64-encode, the PHP file is converted to base64 instead of executed — leaking the full source code including hardcoded API keys and credentials.',
    vulnerableCode: `// Invoice template loader (vulnerable):
app.get('/invoice/render', isAuthenticated, async (req, res) => {
  const { file } = req.query;
  // ❌ Accepts PHP wrappers! php://filter, data://, zip:// etc.
  const content = await includeFile(file); // simulates PHP include()
  res.send(content);
});`,
    exploitation:
      'file: "php://filter/convert.base64-encode/resource=../config/payment.php"\n→ Returns base64-encoded PHP source of payment.php\n→ Decode to reveal Stripe keys, DB password, and flag',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try file: "templates/invoice_basic" — works normally. PHP has special stream wrappers like php://filter. What if you use php://filter as the file parameter?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'php://filter/convert.base64-encode/resource=<path> reads a file and returns it as base64. This bypasses PHP execution — you get the source code, not the output.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /invoice/render with { "file": "php://filter/convert.base64-encode/resource=../config/payment.php" }. Decode the base64 response to read payment.php source.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'The decoded PHP source contains STRIPE_SECRET_KEY and the flag. Also try resource=../config/database.php for DB credentials.',
    },
  ],
  flagAnswer: 'FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}',
  initialState: {
    contents: [
      {
        title: 'PAYMENT_PHP',
        body: '<?php\n// BillPro Payment Gateway Config\ndefine("STRIPE_PUBLIC_KEY", "pk_live_billpro_abc123");\ndefine("STRIPE_SECRET_KEY", "sk_live_billpro_SECRET_xyz789");\ndefine("PAYPAL_CLIENT_ID", "AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwznKYgkw2PeWhj");\ndefine("PAYPAL_SECRET", "EGnHDxD_qRPbzbImZyK6b");\n// FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}\n$webhook_secret = "whsec_billpro_prod_2024";\n?>',
        author: 'php_source',
        isPublic: false,
      },
      {
        title: 'DATABASE_PHP',
        body: '<?php\ndefine("DB_HOST", "db-billpro-prod.internal");\ndefine("DB_USER", "billpro_admin");\ndefine("DB_PASS", "B1llPr0_DB_S3cr3t!");\ndefine("DB_NAME", "billpro_production");\n?>',
        author: 'php_source',
        isPublic: false,
      },
      {
        title: 'INVOICE_BASIC',
        body: '<html><body><h1>Invoice #{{invoice_id}}</h1><p>Amount: {{amount}}</p></body></html>',
        author: 'template_file',
        isPublic: true,
      },
    ],
  },
};
