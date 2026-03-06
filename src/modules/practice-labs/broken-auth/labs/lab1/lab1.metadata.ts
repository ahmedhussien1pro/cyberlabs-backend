// src/modules/practice-labs/broken-auth/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab1Metadata: LabMetadata = {
  slug: 'broken-auth-credential-stuffing-streaming',
  title:
    'Broken Auth: Credential Stuffing — Streaming Platform Account Takeover',
  ar_title: 'Broken Auth: حشو بيانات الاعتماد — الاستيلاء على حساب منصة البث',
  description:
    'Exploit a broken authentication vulnerability on a streaming platform with no rate limiting or account lockout. Perform credential stuffing using a leaked password list to take over a premium subscriber account.',
  ar_description:
    'استغل ثغرة المصادقة المكسورة في منصة بث بدون rate limiting أو account lockout. قم بحشو بيانات الاعتماد باستخدام قائمة كلمات مرور مسربة للاستيلاء على حساب مشترك مميز.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Credential Stuffing',
    'Brute Force',
    'No Rate Limiting',
    'Account Lockout Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The target account is admin@streamvault.io. Use the provided leaked password list to brute force the login endpoint. There is no rate limiting, no lockout, and no CAPTCHA. Find the correct password and login to retrieve the flag.',
  ar_goal:
    'الحساب المستهدف هو admin@streamvault.io. استخدم قائمة كلمات المرور المسرَّبة لمهاجمة endpoint تسجيل الدخول بالقوة الغاشمة. لا يوجد rate limiting، لا lockout، لا CAPTCHA. ابحث عن كلمة المرور الصحيحة وسجّل الدخول لاسترداد العلم.',

  briefing: {
    en: `StreamVault — premium video streaming. 4K content, exclusive series, live sports.
You are not a subscriber. You want to be.
More specifically — you want admin@streamvault.io.
Every month, a new breach drops somewhere on the internet.
Millions of email:password pairs. Most users reuse passwords.
You have a list. 15 passwords. Common reuses.
The login endpoint: POST /auth/login.
You try the first password.
401. Invalid credentials.
You try again.
401.
Again.
No delay. No CAPTCHA. No warning. No lockout.
The server responds in milliseconds every time.
15 attempts. One of them will work.`,
    ar: `StreamVault — بث فيديو مميز. محتوى 4K، مسلسلات حصرية، رياضة مباشرة.
أنت لست مشتركاً. تريد أن تكون.
بشكل أدق — تريد admin@streamvault.io.
كل شهر، يظهر خرق جديد في مكان ما على الإنترنت.
ملايين أزواج email:password. معظم المستخدمين يعيدون استخدام كلمات المرور.
لديك قائمة. 15 كلمة مرور. إعادة استخدام شائعة.
endpoint تسجيل الدخول: POST /auth/login.
تحاول كلمة المرور الأولى.
401. بيانات اعتماد غير صالحة.
تحاول مرة أخرى.
401.
مرة أخرى.
لا تأخير. لا CAPTCHA. لا تحذير. لا lockout.
الخادم يستجيب في ميلي ثانية كل مرة.
15 محاولة. واحدة منها ستنجح.`,
  },

  stepsOverview: {
    en: [
      'GET /auth/leaked-passwords — retrieve the list of 15 leaked passwords to try',
      'POST /auth/login { "email": "admin@streamvault.io", "password": "<password_1>" } — observe instant 401, no delay',
      'Iterate through all 15 passwords — confirm no rate limiting, no lockout between attempts',
      'Identify the successful response (200 with JWT token)',
      'Use the JWT to access /admin/dashboard → flag returned',
    ],
    ar: [
      'GET /auth/leaked-passwords — استرجع قائمة الـ 15 كلمة مرور المسرَّبة للمحاولة',
      'POST /auth/login { "email": "admin@streamvault.io"، "password": "<password_1>" } — لاحظ 401 فوري بدون تأخير',
      'كرر مع كل الـ 15 كلمة مرور — أكّد غياب rate limiting والـ lockout بين المحاولات',
      'حدد الاستجابة الناجحة (200 مع JWT token)',
      'استخدم JWT للوصول إلى /admin/dashboard → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'StreamVault /auth/login has zero protection against brute force: no rate limiting, no account lockout after N failed attempts, no CAPTCHA, no IP throttling, no exponential backoff. The admin account password ("Str3amV@ult2024!") is in the 10th position of the leaked password list — discoverable in under 1 second with automated requests.',
    vulnerableCode:
      "// Login endpoint (vulnerable):\napp.post('/auth/login', async (req, res) => {\n" +
      '  const { email, password } = req.body;\n' +
      '  const user = await db.users.findOne({ email });\n' +
      '  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {\n' +
      '    // ❌ No rate limiting — unlimited attempts allowed\n' +
      '    // ❌ No account lockout after N failed attempts\n' +
      '    // ❌ No CAPTCHA, no IP throttling\n' +
      "    return res.status(401).json({ error: 'Invalid credentials' });\n" +
      '  }\n' +
      '  res.json({ token: generateJWT(user) });\n' +
      '});',
    exploitation:
      'GET /auth/leaked-passwords → iterate: POST /auth/login { "email": "admin@streamvault.io", "password": "<each>" } → 10th attempt: "Str3amV@ult2024!" → 200 OK + JWT → GET /admin/dashboard → flag',
    steps: {
      en: [
        'GET /auth/leaked-passwords → returns array of 15 passwords',
        'Loop: POST /auth/login { "email": "admin@streamvault.io", "password": "<password>" } for each → 401 for 9 attempts',
        '10th attempt: { "password": "Str3amV@ult2024!" } → 200 OK + { "token": "eyJ..." }',
        'GET /admin/dashboard with Authorization: Bearer <token> → flag: FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
      ar: [
        'GET /auth/leaked-passwords → يُعيد مصفوفة من 15 كلمة مرور',
        'حلقة: POST /auth/login { "email": "admin@streamvault.io"، "password": "<password>" } لكل كلمة → 401 لـ 9 محاولات',
        'المحاولة الـ 10: { "password": "Str3amV@ult2024!" } → 200 OK + { "token": "eyJ..." }',
        'GET /admin/dashboard مع Authorization: Bearer <token> → العلم: FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
    },
    fix: [
      'Rate limiting: max 5 login attempts per IP per 15 minutes — use Redis sliding window counter',
      'Account lockout: lock account for 15 minutes after 10 failed attempts, notify user via email',
      'CAPTCHA after 3 failures: invisible CAPTCHA (hCaptcha/Cloudflare Turnstile) on repeated failures',
      'Credential stuffing detection: flag login attempts where the same IP tries multiple different accounts',
      'Password breach monitoring: integrate Have I Been Pwned API to detect reused breached passwords',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Credential stuffing attacks succeed because: (1) users reuse passwords across services, (2) authentication endpoints have no automated attack protection. The attack requires no technical sophistication — just a leaked password list and an HTTP client. Without rate limiting, a 15-password list takes under one second. A 10-million-entry list from a major breach would take minutes with concurrent requests.',
      ar: 'تنجح هجمات حشو بيانات الاعتماد لأن: (1) المستخدمين يعيدون استخدام كلمات المرور عبر الخدمات، (2) نقاط نهاية المصادقة ليس لها حماية من الهجمات الآلية. لا يتطلب الهجوم أي تطور تقني — فقط قائمة كلمات مرور مسرَّبة وعميل HTTP. بدون rate limiting، تستغرق قائمة الـ 15 كلمة مرور أقل من ثانية واحدة. قائمة من 10 مليون مدخل من خرق رئيسي تستغرق دقائق مع الطلبات المتزامنة.',
    },
    impact: {
      en: 'Admin account takeover on a premium streaming platform: full user database access, billing information, content management, subscriber data. In real incidents, streaming platform credential stuffing attacks affect millions of accounts and result in massive fraud (unauthorized subscription sharing, account reselling on dark markets).',
      ar: 'الاستيلاء على حساب المسؤول في منصة بث مميزة: وصول كامل لقاعدة بيانات المستخدمين، معلومات الفوترة، إدارة المحتوى، بيانات المشتركين. في الحوادث الحقيقية، تؤثر هجمات حشو بيانات الاعتماد على منصات البث على ملايين الحسابات وتؤدي إلى احتيال ضخم (مشاركة الاشتراكات غير المصرح بها، إعادة بيع الحسابات في الأسواق المظلمة).',
    },
    fix: [
      'Rate limiting + exponential backoff: 5 attempts → 1min lockout → 10 attempts → 1hr lockout → 15 attempts → 24hr lockout',
      'Multi-factor authentication: even with a correct password, MFA prevents account takeover',
      'Anomaly detection: flag and investigate login bursts from a single IP or distributed botnets',
      'Leaked password database check: on every login, verify password not in known breach databases',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try logging in multiple times with wrong passwords. Notice: no delay, no lockout, no CAPTCHA. The server responds instantly every time. How many attempts can you make per second?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Use GET /auth/leaked-passwords to get the list of 15 commonly reused passwords to try against admin@streamvault.io.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /auth/login repeatedly: { "email": "admin@streamvault.io", "password": "<each_password>" }. Or use /auth/brute-force-simulate to automate the iteration.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
  initialState: {
    users: [
      {
        username: 'admin_streamvault',
        password: 'Str3amV@ult2024!',
        role: 'admin',
        email: 'admin@streamvault.io',
      },
    ],
    contents: [
      {
        title: 'LEAKED_PASSWORDS',
        body: JSON.stringify([
          'password123',
          'admin1234',
          'letmein!',
          'qwerty2024',
          'Summer2024!',
          'Welcome1!',
          'Pass@word1',
          'Monkey123!',
          'Dragon2024',
          'Str3amV@ult2024!',
          'Football99',
          'Sunshine1!',
          'shadow2024',
          'master123!',
          'iloveyou!1',
        ]),
        author: 'leaked_db',
        isPublic: true,
      },
    ],
  },
};
