// src/modules/practice-labs/xss/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab2Metadata: LabMetadata = {
  slug: 'xss-review-moderation-stored',
  title: 'XSS: Review Moderation Poison',
  ar_title: 'XSS المخزَّن: تسميم لوحة مراجعات المنتجات',
  description:
    'Submit a malicious product review that will execute JavaScript when the admin opens the Review Moderation Dashboard.',
  ar_description:
    'أرسل تقييم منتج خبيث يُنفَّذ كـ JavaScript عندما يفتح المشرف لوحة مراجعة التقييمات.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Stored XSS',
    'Privilege Escalation via XSS',
    'Session Hijacking Simulation',
  ],
  xpReward: 200,
  pointsReward: 100,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Store an XSS payload in a product review. Then trigger the "Admin Moderate Reviews" action to simulate the admin\'s browser executing your script and leaking their session token.',
  ar_goal:
    'خزّن XSS payload في تقييم منتج. ثم افعّل إجراء "Admin Moderate Reviews" لمحاكاة تنفيذ متصفح الأدمن لسكريبتك وتسريب رمز جلسته.',

  briefing: {
    en: `TechMart — a B2B electronics marketplace serving enterprises across the region.
You're buyer_alice. You just bought a USB-C dock.
You can leave a product review. Up to 500 characters. "For formatting support."
Formatting support. Interesting.
You submit a review: <b>Great product!</b>
You check the product page. The text is bold.
HTML is rendering. Not escaped. Not encoded.
Now you think about the admin.
An admin_moderator visits the Moderation Dashboard periodically.
They load ALL pending reviews.
Each review is rendered directly into the page as innerHTML.
The admin's browser. Their session. Their cookies.
All waiting for you to write the right review.`,
    ar: `TechMart — سوق إلكترونية B2B تخدم المؤسسات في المنطقة.
أنت buyer_alice. اشتريت للتو USB-C dock.
يمكنك ترك تقييم للمنتج. حتى 500 حرف. "لدعم التنسيق."
دعم التنسيق. مثير للاهتمام.
ترسل تقييماً: <b>منتج رائع!</b>
تتحقق من صفحة المنتج. النص بخط عريض.
HTML يُعرَض. غير مُهرَّب. غير مرمَّز.
الآن تفكر في الأدمن.
يزور admin_moderator لوحة المراجعات بشكل دوري.
يحمّل جميع التقييمات المعلقة.
كل تقييم يُعرَض مباشرة في الصفحة كـ innerHTML.
متصفح الأدمن. جلستهم. كوكيزهم.
كلها تنتظرك لتكتب التقييم الصحيح.`,
  },

  stepsOverview: {
    en: [
      'Submit a normal review — confirm it appears on the product page',
      'Test HTML injection: submit <b>Bold</b> — if it renders bold, injection is confirmed',
      'Craft a stored XSS payload in your review content',
      'Trigger the "Simulate Admin View" endpoint to simulate admin loading the moderation dashboard',
      "Admin's browser executes your payload — flag revealed",
    ],
    ar: [
      'أرسل تقييماً عادياً — أكّد ظهوره في صفحة المنتج',
      'اختبر حقن HTML: أرسل <b>Bold</b> — إن عُرض بخط عريض، تم تأكيد الحقن',
      'صمّم Stored XSS payload في محتوى تقييمك',
      'افعّل نقطة "Simulate Admin View" لمحاكاة تحميل الأدمن للوحة المراجعات',
      'ينفذ متصفح الأدمن payload الخاص بك — يُكشَف العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'TechMart admin dashboard renders product reviews using innerHTML without sanitization: `container.innerHTML += \`<div class="review">${review.content}</div>\``. Any HTML stored in review content is executed as markup in the admin\'s browser context when they load the moderation dashboard.',
    vulnerableCode:
      '// Admin dashboard renders reviews without sanitization:\n' +
      'reviews.forEach(review => {\n' +
      '  container.innerHTML += `<div class="review">${review.content}</div>`;\n' +
      '});',
    exploitation:
      '1. POST /reviews { "productId": "techmart-dock-07", "content": "<img src=x onerror=alert(document.cookie)>", "rating": 5 }\n' +
      '2. POST /admin/simulate-review-panel → admin dashboard renders stored reviews → onerror fires in admin context → flag returned.',
    steps: {
      en: [
        'POST /reviews { "productId": "techmart-dock-07", "content": "<b>Great!</b>", "rating": 5 } → review saved, HTML renders bold → injection confirmed',
        'POST /reviews { "productId": "techmart-dock-07", "content": "<img src=x onerror=alert(document.cookie)>", "rating": 1 } → XSS payload stored',
        'POST /admin/simulate-review-panel → backend simulates admin loading all pending reviews',
        'Stored payload fires in admin context → cookie alert simulated → FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772} returned',
      ],
      ar: [
        'POST /reviews { "productId": "techmart-dock-07", "content": "<b>رائع!</b>", "rating": 5 } → التقييم مُحفَظ، HTML يُعرَض بخط عريض → تم تأكيد الحقن',
        'POST /reviews { "productId": "techmart-dock-07", "content": "<img src=x onerror=alert(document.cookie)>", "rating": 1 } → تم تخزين XSS payload',
        'POST /admin/simulate-review-panel → يحاكي الـ backend تحميل الأدمن لجميع التقييمات المعلقة',
        'يُطلَق الـ payload المخزَّن في سياق الأدمن → محاكاة تنبيه الكوكي → يُعاد FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
      ],
    },
    fix: [
      'Never use innerHTML to render user-supplied content — use textContent or createElement instead',
      'Sanitize stored HTML with DOMPurify before rendering: DOMPurify.sanitize(review.content)',
      'Strip HTML tags on write (server-side): reject reviews containing HTML tags, or store plain text only',
      "CSP: script-src 'self' — limits damage even if stored XSS exists by blocking inline execution",
    ],
  },

  postSolve: {
    explanation: {
      en: "Stored XSS (also called Persistent XSS) plants malicious code into the application's database. Unlike Reflected XSS, the payload doesn't need to be in a URL the victim clicks — it fires automatically for every user (especially admins) who views the infected content. The admin moderation dashboard pattern is a classic high-value target: it aggregates user-submitted content and admins have elevated session privileges.",
      ar: 'يزرع Stored XSS (المعروف أيضاً بـ Persistent XSS) كوداً خبيثاً في قاعدة بيانات التطبيق. على عكس Reflected XSS، لا يحتاج الـ payload إلى أن يكون في URL تنقر عليه الضحية — يُطلَق تلقائياً لكل مستخدم (خاصة الأدمنة) يشاهد المحتوى المصاب. نمط لوحة مراجعة الأدمن هو هدف كلاسيكي عالي القيمة: يجمع المحتوى المُقدَّم من المستخدمين والأدمنة لديهم امتيازات جلسة مرتفعة.',
    },
    impact: {
      en: 'Permanent session hijacking — every admin who views the moderation dashboard is compromised until the payload is removed. Account takeover without any user interaction from the victim (no phishing link required). Full admin access means complete platform compromise.',
      ar: 'اختطاف جلسة دائم — كل أدمن يشاهد لوحة المراجعات يُختَرَق حتى إزالة الـ payload. الاستيلاء على الحساب دون أي تفاعل من المستخدم الضحية (لا حاجة لرابط تصيد). الوصول الكامل للأدمن يعني اختراق كامل للمنصة.',
    },
    fix: [
      'Primary: DOMPurify.sanitize() before any innerHTML assignment',
      'Architecture: separate write-path (sanitize on save) from read-path (sanitize on render) — do both',
      'Admin panels should have extra scrutiny: review all places where user content is rendered to admins',
      'HttpOnly cookies: while XSS can still do damage, HttpOnly prevents direct cookie theft via document.cookie',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Submit a review with <b>Bold Text</b> — if it renders as bold on the product page or moderation panel, HTML is not being sanitized. Injection is confirmed.',
    },
    {
      order: 2,
      xpCost: 25,
      content:
        "The goal is to execute JavaScript in the ADMIN's browser, not your own. Store a payload in a review, then use POST /admin/simulate-review-panel to trigger the admin's perspective.",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        'Payload: submit review content as <img src=x onerror="alert(document.cookie)">. After submitting, trigger the admin panel simulation — the lab detects the execution and returns the flag.',
    },
  ],

  flagAnswer: 'FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
  initialState: {
    users: [
      {
        username: 'admin_moderator',
        password: 'Tr0ub4dor&3_secure!',
        role: 'ADMIN',
      },
      { username: 'buyer_alice', password: 'alice_buyer_123', role: 'USER' },
    ],
    contents: [
      {
        title: 'UltraHub USB-C 7-in-1 Dock',
        body: 'product',
        meta: {
          productId: 'techmart-dock-07',
          price: 89.99,
          category: 'Accessories',
          rating: 4.5,
        },
      },
    ],
    logs: [
      {
        action: 'REVIEW',
        meta: {
          productId: 'techmart-dock-07',
          author: 'verified_buyer_99',
          content:
            'Excellent build quality! Works perfectly with my MacBook Pro.',
          rating: 5,
          status: 'pending',
        },
      },
    ],
  },
};
