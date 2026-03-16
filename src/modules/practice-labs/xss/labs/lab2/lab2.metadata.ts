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
  skills: ['Stored XSS', 'Privilege Escalation via XSS', 'Session Hijacking Simulation'],
  xpReward: 200,
  pointsReward: 100,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  canonicalConceptId: 'xss-stored',
  environmentType: 'ECOMMERCE',

  missionBrief: {
    codename: 'POISON REVIEW',
    classification: 'SECRET',
    objective: 'Plant a stored XSS payload in a product review on TechMart. When the admin loads the moderation dashboard, your script executes in their browser context and leaks their session token.',
    ar_objective: 'ازرع XSS payload مخزَّن في تقييم منتج على TechMart. عندما يحمّل الأدمن لوحة المراجعات، ينفذ سكريبتك في سياق متصفحه ويُسرَّب رمز جلسته.',
    background: 'Stored XSS in admin dashboards is one of the most dangerous web vulnerabilities — no user interaction needed from the victim.',
    successCriteria: [
      'Submit a review and confirm it renders HTML',
      'Store a JS payload in a review',
      'Trigger the admin panel simulation',
      'Capture the flag from the admin session leak',
    ],
    warningNote: 'Admin simulation is server-side only — no real browser is compromised in this lab.',
  },

  labInfo: {
    vulnType: 'Stored XSS',
    ar_vulnType: 'XSS مخزَّن',
    cweId: 'CWE-79',
    cvssScore: 8.8,
    description: 'Stored XSS embeds malicious scripts into the database. Every user who views the infected content executes the payload — admins are the highest-value targets.',
    ar_description: 'يُضمِّن Stored XSS سكريبتات خبيثة في قاعدة البيانات. كل مستخدم يشاهد المحتوى المصاب يُنفّذ الـ payload — الأدمنة هم أعلى الأهداف قيمة.',
    whatYouLearn: [
      'Difference between Reflected and Stored XSS',
      'Why admin panels are prime Stored XSS targets',
      'How innerHTML renders stored payloads',
      'DOMPurify as the primary defense',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'innerHTML', 'DOMPurify'],
    references: [
      { label: 'PortSwigger: Stored XSS', url: 'https://portswigger.net/web-security/cross-site-scripting/stored' },
    ],
  },

  goal: 'Store an XSS payload in a product review. Then trigger the "Admin Moderate Reviews" action to simulate the admin\'s browser executing your script and leaking their session token.',
  ar_goal: 'خزّن XSS payload في تقييم منتج. ثم افعّل إجراء "Admin Moderate Reviews" لمحاكاة تنفيذ متصفح الأدمن لسكريبتك وتسريب رمز جلسته.',

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
كل تقييم يُعرَض مباشرة في الصفحة كـ innerHTML.`,
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

  solution: {
    context: 'TechMart admin dashboard renders product reviews using innerHTML without sanitization.',
    vulnerableCode: 'reviews.forEach(review => {\n  container.innerHTML += `<div class="review">${review.content}</div>`;\n});',
    exploitation: '1. POST /reviews { "productId": "techmart-dock-07", "content": "<img src=x onerror=alert(document.cookie)>", "rating": 5 }\n2. POST /admin/simulate-review-panel → admin dashboard renders stored reviews → onerror fires in admin context → flag returned.',
    steps: {
      en: [
        'POST /reviews { "content": "<b>Great!</b>", "rating": 5 } → HTML renders bold → injection confirmed',
        'POST /reviews { "content": "<img src=x onerror=alert(document.cookie)>" } → XSS payload stored',
        'POST /admin/simulate-review-panel → backend simulates admin loading all pending reviews',
        'Stored payload fires in admin context → flag returned',
      ],
      ar: [
        'POST /reviews { "content": "<b>رائع!</b>", "rating": 5 } → HTML يُعرَض بخط عريض → تم تأكيد الحقن',
        'POST /reviews { "content": "<img src=x onerror=alert(document.cookie)>" } → تم تخزين XSS payload',
        'POST /admin/simulate-review-panel → يحاكي الـ backend تحميل الأدمن للتقييمات',
        'يُطلَق الـ payload في سياق الأدمن → يُعاد العلم',
      ],
    },
    fix: [
      'Never use innerHTML to render user-supplied content',
      'Sanitize stored HTML with DOMPurify before rendering',
      'Strip HTML tags on write (server-side)',
      "CSP: script-src 'self'",
    ],
  },

  postSolve: {
    explanation: {
      en: 'Stored XSS plants malicious code into the database. Unlike Reflected XSS, the payload fires automatically for every user who views the infected content — admins are the highest-value targets.',
      ar: 'يزرع Stored XSS كوداً خبيثاً في قاعدة البيانات. على عكس Reflected XSS، يُطلَق الـ payload تلقائياً لكل مستخدم يشاهد المحتوى المصاب.',
    },
    impact: {
      en: 'Permanent session hijacking — every admin who views the moderation dashboard is compromised until the payload is removed.',
      ar: 'اختطاف جلسة دائم — كل أدمن يشاهد لوحة المراجعات يُختَرَق حتى إزالة الـ payload.',
    },
    fix: [
      'DOMPurify.sanitize() before any innerHTML assignment',
      'Sanitize on both save and render',
      'HttpOnly cookies to prevent direct cookie theft',
    ],
  },

  hints: [
    {
      order: 1, xpCost: 15,
      content: 'Submit a review with <b>Bold Text</b> — if it renders as bold, HTML is not being sanitized.',
      ar_content: 'أرسل تقييماً بـ <b>Bold Text</b> — إن ظهر بخط عريض، HTML غير مُعقَّم.',
    },
    {
      order: 2, xpCost: 25,
      content: "The goal is to execute JavaScript in the ADMIN's browser. Store a payload in a review, then use POST /admin/simulate-review-panel.",
      ar_content: 'الهدف هو تنفيذ JavaScript في متصفح الأدمن. خزّن payload في تقييم، ثم استخدم POST /admin/simulate-review-panel.',
    },
    {
      order: 3, xpCost: 40,
      content: 'Payload: <img src=x onerror="alert(document.cookie)">. After submitting, trigger the admin panel simulation.',
      ar_content: 'الـ payload: <img src=x onerror="alert(document.cookie)">. بعد الإرسال، افعّل محاكاة لوحة الأدمن.',
    },
  ],

  flagAnswer: 'FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
  initialState: {
    users: [
      { username: 'admin_moderator', password: 'Tr0ub4dor&3_secure!', role: 'ADMIN' },
      { username: 'buyer_alice', password: 'alice_buyer_123', role: 'USER' },
    ],
    contents: [
      { title: 'UltraHub USB-C 7-in-1 Dock', body: 'product', meta: { productId: 'techmart-dock-07', price: 89.99, category: 'Accessories', rating: 4.5 } },
    ],
    logs: [
      { action: 'REVIEW', meta: { productId: 'techmart-dock-07', author: 'verified_buyer_99', content: 'Excellent build quality!', rating: 5, status: 'pending' } },
    ],
  },
};
