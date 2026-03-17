// src/modules/practice-labs/broken-auth/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab1Metadata: LabMetadata = {
  slug: 'broken-auth-credential-stuffing-streaming',
  canonicalConceptId: 'broken-auth-credential-stuffing',
  environmentType: 'STREAMING_PLATFORM',
  title: 'Broken Auth: Credential Stuffing — Streaming Platform Account Takeover',
  ar_title: 'Broken Auth: حشو بيانات الاعتماد — الاستيلاء على حساب منصة البث',
  description:
    'Exploit a broken authentication vulnerability on a streaming platform with no rate limiting or account lockout. Perform credential stuffing using a leaked password list to take over a premium subscriber account.',
  ar_description:
    'استغل ثغرة المصادقة المكسورة في منصة بث بدون rate limiting أو account lockout. قم بحشو بيانات الاعتماد باستخدام قائمة كلمات مرور مسرَّبة للاستيلاء على حساب مشترك مميز.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['Broken Authentication', 'Credential Stuffing', 'Brute Force', 'No Rate Limiting', 'Account Lockout Bypass'],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION STREAM TAKEOVER',
    classification: 'CONFIDENTIAL',
    objective: {
      en: 'Exploit StreamVault login endpoint with zero brute-force protection. Use a leaked password list to take over the admin account and access the premium dashboard.',
      ar: 'استغل endpoint تسجيل الدخول في StreamVault الخالي من أي حماية ضد القوة الغاشمة. استخدم قائمة كلمات المرور المسرَّبة للاستيلاء على حساب الأدمن والوصول إلى لوحة التحكم المميزة.',
    },
    successCriteria: {
      en: 'Login as admin@streamvault.io and retrieve the flag from /admin/dashboard.',
      ar: 'سجّل الدخول كـ admin@streamvault.io واسترجع العلم من /admin/dashboard.',
    },
  },

  labInfo: {
    vulnType: 'Broken Authentication — No Rate Limiting / Credential Stuffing',
    cweId: 'CWE-307',
    cvssScore: 7.5,
    whatYouLearn: {
      en: [
        'How credential stuffing works using leaked password lists',
        'Why login endpoints must have rate limiting and account lockout',
        'How to detect and automate brute force against unprotected endpoints',
        'Mitigation: rate limiting + lockout + CAPTCHA + MFA',
      ],
      ar: [
        'كيف يعمل حشو بيانات الاعتماد باستخدام قوائم كلمات المرور المسرَّبة',
        'لماذا يجب أن تمتلك نقاط نهاية تسجيل الدخول rate limiting وaccount lockout',
        'كيفية اكتشاف وأتمتة القوة الغاشمة ضد النقاط غير المحمية',
        'التخفيف: rate limiting + lockout + CAPTCHA + MFA',
      ],
    },
    techStack: ['REST API', 'Node.js', 'JWT', 'bcrypt'],
    references: [
      'https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication',
      'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/307.html',
    ],
  },

  goal: 'The target account is admin@streamvault.io. Use the provided leaked password list to brute force the login endpoint. There is no rate limiting, no lockout, and no CAPTCHA. Find the correct password and login to retrieve the flag.',
  ar_goal:
    'الحساب المستهدف هو admin@streamvault.io. استخدم قائمة كلمات المرور المسرَّبة لمهاجمة endpoint تسجيل الدخول بالقوة الغاشمة. لا يوجد rate limiting، لا lockout، لا CAPTCHA.',

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
كل شهر، يظهر خرق جديد.
ملايين أزواج email:password. معظم المستخدمين يعيدون استخدام كلمات المرور.
لديك قائمة. 15 كلمة مرور.
endpoint تسجيل الدخول: POST /auth/login.
لا تأخير. لا CAPTCHA. لا تحذير. لا lockout.
15 محاولة. واحدة ستنجح.`,
  },

  stepsOverview: {
    en: [
      'GET /auth/leaked-passwords — retrieve the list of 15 leaked passwords',
      'POST /auth/login { "email": "admin@streamvault.io", "password": "<password_1>" } — observe instant 401',
      'Iterate through all 15 passwords — confirm no rate limiting or lockout',
      'Identify the successful 200 response with JWT token',
      'Use JWT to access /admin/dashboard → flag returned',
    ],
    ar: [
      'GET /auth/leaked-passwords — استرجع قائمة الـ 15 كلمة مرور المسرَّبة',
      'POST /auth/login { "email": "admin@streamvault.io"، "password": "<password_1>" } — لاحظ 401 فوري',
      'كرّر مع كل الـ 15 كلمة مرور — أكّد غياب rate limiting وlockout',
      'حدد الاستجابة الناجحة 200 مع JWT token',
      'استخدم JWT للوصول إلى /admin/dashboard → يُعاد العلم',
    ],
  },

  solution: {
    context:
      'StreamVault /auth/login has zero protection: no rate limiting, no account lockout, no CAPTCHA, no IP throttling. The admin password "Str3amV@ult2024!" is in the 10th position of the leaked list.',
    vulnerableCode:
      "app.post('/auth/login', async (req, res) => {\n" +
      '  const { email, password } = req.body;\n' +
      '  const user = await db.users.findOne({ email });\n' +
      '  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {\n' +
      '    // ❌ No rate limiting, no lockout, no CAPTCHA\n' +
      "    return res.status(401).json({ error: 'Invalid credentials' });\n" +
      '  }\n' +
      '  res.json({ token: generateJWT(user) });\n' +
      '});',
    exploitation:
      'GET /auth/leaked-passwords → iterate POST /auth/login → 10th attempt "Str3amV@ult2024!" → 200 + JWT → GET /admin/dashboard → flag',
    steps: {
      en: [
        'GET /auth/leaked-passwords → returns array of 15 passwords',
        'Loop POST /auth/login for each password → 401 for 9 attempts',
        '10th: { "password": "Str3amV@ult2024!" } → 200 OK + JWT token',
        'GET /admin/dashboard with Bearer token → FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
      ar: [
        'GET /auth/leaked-passwords → يُعيد 15 كلمة مرور',
        'حلقة POST /auth/login لكل كلمة → 401 لـ 9 محاولات',
        'الـ 10: { "password": "Str3amV@ult2024!" } → 200 OK + JWT',
        'GET /admin/dashboard → FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
    },
    fix: [
      'Rate limiting: max 5 login attempts per IP per 15 minutes',
      'Account lockout: lock after 10 failed attempts, notify via email',
      'CAPTCHA after 3 failures',
      'MFA: even with correct password, MFA blocks takeover',
      'Have I Been Pwned API integration for breached password detection',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Credential stuffing succeeds because users reuse passwords and login endpoints lack automated attack protection. No technical sophistication required — just a leaked list and an HTTP client.',
      ar: 'ينجح حشو بيانات الاعتماد لأن المستخدمين يعيدون استخدام كلمات المرور ونقاط الدخول تفتقر لحماية الهجمات الآلية.',
    },
    impact: {
      en: 'Admin takeover: full user database, billing info, content management. Real incidents affect millions of streaming accounts with massive fraud.',
      ar: 'استيلاء على حساب الأدمن: قاعدة بيانات المستخدمين كاملة، معلومات الفوترة، إدارة المحتوى.',
    },
    fix: [
      'Rate limiting + exponential backoff',
      'Multi-factor authentication',
      'Anomaly detection for login bursts',
      'Leaked password database check on every login',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      ar_content: 'جرّب تسجيل الدخول عدة مرات بكلمات مرور خاطئة. لاحظ: لا تأخير، لا lockout، لا CAPTCHA. كم محاولة تستطيع عملها في الثانية؟',
      content: 'Try logging in multiple times with wrong passwords. Notice: no delay, no lockout, no CAPTCHA. How many attempts can you make per second?',
    },
    {
      order: 2,
      xpCost: 20,
      ar_content: 'استخدم GET /auth/leaked-passwords للحصول على قائمة الـ 15 كلمة مرور الشائعة إعادة استخدامها لتجربتها ضد admin@streamvault.io.',
      content: 'Use GET /auth/leaked-passwords to get the list of 15 commonly reused passwords to try against admin@streamvault.io.',
    },
    {
      order: 3,
      xpCost: 35,
      ar_content: 'POST /auth/login بشكل متكرر: { "email": "admin@streamvault.io"، "password": "<each_password>" }. أو استخدم /auth/brute-force-simulate لأتمتة التكرار.',
      content: 'POST /auth/login repeatedly with each password from the list. Or use /auth/brute-force-simulate to automate the iteration.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
  initialState: {
    users: [
      { username: 'admin_streamvault', password: 'Str3amV@ult2024!', role: 'admin', email: 'admin@streamvault.io' },
    ],
    contents: [
      {
        title: 'LEAKED_PASSWORDS',
        body: JSON.stringify(['password123', 'admin1234', 'letmein!', 'qwerty2024', 'Summer2024!', 'Welcome1!', 'Pass@word1', 'Monkey123!', 'Dragon2024', 'Str3amV@ult2024!', 'Football99', 'Sunshine1!', 'shadow2024', 'master123!', 'iloveyou!1']),
        author: 'leaked_db',
        isPublic: true,
      },
    ],
  },
};
