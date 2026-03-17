// src/modules/practice-labs/broken-auth/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab2Metadata: LabMetadata = {
  slug: 'broken-auth-remember-me-token-forgery-travel',
  canonicalConceptId: 'broken-auth-predictable-token',
  environmentType: 'TRAVEL_BOOKING',
  title: 'Broken Auth: Predictable Remember-Me Token — Travel Booking Account Takeover',
  ar_title: 'Broken Auth: توكن Remember-Me قابل للتنبؤ — الاستيلاء على حساب حجز السفر',
  description: 'Exploit a broken authentication vulnerability where the remember-me token uses a weak, predictable Base64 algorithm. Forge a valid token for an admin account.',
  ar_description: 'استغل ثغرة مصادقة حيث يستخدم توكن remember-me خوارزمية Base64 ضعيفة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['Broken Authentication', 'Token Forgery', 'Predictable Token', 'Persistent Session Attack', 'Cryptographic Weakness'],
  xpReward: 240,
  pointsReward: 120,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION GHOST COOKIE',
    classification: 'SECRET',
    objective: 'Analyze your own remember-me cookie on FlyTrek to reverse-engineer the token generation algorithm, then forge an admin token.',
    ar_objective: 'حلّل كوكي remember-me وعكس خوارزمية التوليد، ثم زوّر توكن أدمن.',
    successCriteria: ['Access /admin/dashboard as admin@flytrek.io using only a forged remember-me token'],
    ar_successCriteria: ['صل إلى /admin/dashboard بوصفك admin@flytrek.io باستخدام توكن مزوَّر فقط'],
  },

  labInfo: {
    vulnType: 'Broken Authentication — Predictable Token / Token Forgery',
    ar_vulnType: 'Broken Authentication — توكن قابل للتنبؤ / تزوير توكن',
    cweId: 'CWE-330',
    cvssScore: 8.1,
    description: 'Remember-me token is Base64(email:role:dayNumber) — trivially forgeable by any attacker who sees their own token.',
    ar_description: 'توكن remember-me هو Base64(email:role:dayNumber) — يمكن تزويره بسهولة.',
    whatYouLearn: [
      'How predictable token generation enables session forgery',
      'Why Base64 is encoding not encryption',
      'Token design: opaque random token + server-side DB lookup',
      'Mitigation: crypto.randomBytes(32) + DB-backed session',
    ],
    ar_whatYouLearn: [
      'كيف يمكّن توليد التوكن القابل للتنبؤ من تزوير الجلسة',
      'لماذا Base64 هو ترميز وليس تشفيراً',
      'تصميم التوكن: عشوائي معتم + بحث في DB',
      'التخفيف: crypto.randomBytes(32) + جلسة مدعومة بقاعدة بيانات',
    ],
    techStack: ['REST API', 'Node.js', 'JWT', 'Base64', 'Cookie'],
    references: [
      { label: 'Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' },
      { label: 'OWASP Broken Authentication', url: 'https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication' },
      { label: 'CWE-330', url: 'https://cwe.mitre.org/data/definitions/330.html' },
    ],
  },

  goal: 'Analyze your own remember-me token to discover the weak generation algorithm (Base64 of email:role:date). Forge a token for admin@flytrek.io with role "admin" and use it to access the admin dashboard.',
  ar_goal: 'حلّل توكن remember-me الخاص بك لاكتشاف خوارزمية التوليد الضعيفة.',

  briefing: {
    en: 'FlyTrek remember-me token is Base64(email:role:dayNumber). Decode your own token, understand the pattern, forge admin@flytrek.io:admin:<today>.',
    ar: 'توكن FlyTrek هو Base64(email:role:dayNumber). فكّ توكنك، افهم النمط، زوّر admin@flytrek.io:admin:<today>.',
  },

  stepsOverview: {
    en: [
      'Login as traveler_nour → get remember-me token',
      'Decode Base64 → see email:role:dayNumber pattern',
      'Forge: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → admin session',
      'GET /admin/dashboard → flag',
    ],
    ar: [
      'سجّل الدخول كـ traveler_nour → احصل على التوكن',
      'فك Base64 → شاهد نمط email:role:dayNumber',
      'زوّر: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → جلسة مسؤول',
      'GET /admin/dashboard → العلم',
    ],
  },

  solution: {
    context: 'FlyTrek remember-me token = Base64(email:role:dayNumber). Server trusts embedded claims without DB validation.',
    vulnerableCode: "// Token = Base64(email:role:day)\n// Server decodes and trusts WITHOUT DB lookup!",
    exploitation: 'btoa("admin@flytrek.io:admin:19741") → POST /auth/remember-login → admin session',
    steps: {
      en: [
        'GET /auth/get-remember-token → Base64 token',
        'Decode → pattern confirmed',
        '/auth/forge-token { "email": "admin@flytrek.io", "role": "admin" } → forged',
        'POST /auth/remember-login → admin session → FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
      ar: [
        'GET /auth/get-remember-token → توكن Base64',
        'فك التوكن → تأكيد النمط',
        '/auth/forge-token → توكن مزوَّر',
        'POST /auth/remember-login → FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
    },
    fix: ['Use opaque random tokens (crypto.randomBytes(32)) stored in DB', 'Token rotation on each use', '30-day max expiry'],
  },

  postSolve: {
    explanation: {
      en: 'Base64 is encoding not encryption. Token must be opaque random value pointing to server-stored session data.',
      ar: 'Base64 ترميز وليس تشفيراً. يجب أن يكون التوكن عشوائياً معتماً.',
    },
    impact: {
      en: 'Persistent admin access to travel platform: bookings, payment data, loyalty points.',
      ar: 'وصول دائم للمسؤول: جميع الحجوزات، بيانات الدفع.',
    },
    fix: ['crypto.randomBytes(32) stored in DB', 'Token rotation', '30-day absolute max expiry'],
  },

  hints: [
    { order: 1, xpCost: 15, ar_content: 'سجّل الدخول واستدعِ /auth/get-remember-token. فكّ من Base64 — ماذا ترى؟', content: 'Login and call /auth/get-remember-token. Decode from Base64 — what do you see?' },
    { order: 2, xpCost: 30, ar_content: 'التوكن = Base64(email:role:dayNumber). هل تستطيع تطبيقه على admin@flytrek.io?', content: 'Token = Base64(email:role:dayNumber). Can you apply the same formula for admin@flytrek.io?' },
    { order: 3, xpCost: 55, ar_content: 'استخدم /auth/forge-token ثم POST /auth/remember-login.', content: 'Use /auth/forge-token then POST /auth/remember-login to get admin access.' },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
  initialState: {
    users: [
      { username: 'traveler_nour', password: 'nour123', role: 'user', email: 'nour@flytrek.io' },
      { username: 'admin_flytrek', password: 'FLY_ADM1N_S3CR3T!', role: 'admin', email: 'admin@flytrek.io' },
    ],
  },
};
