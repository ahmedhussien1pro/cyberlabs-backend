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
    'استغل ثغرة المصادقة المكسورة في منصة بث بدون rate limiting أو account lockout.',
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
    objective: 'Exploit StreamVault login endpoint with zero brute-force protection. Use a leaked password list to take over the admin account.',
    ar_objective: 'استغل endpoint تسجيل الدخول في StreamVault. استخدم قائمة كلمات المرور المسرَّبة للاستيلاء على حساب الأدمن.',
    successCriteria: ['Login as admin@streamvault.io', 'Retrieve the flag from /admin/dashboard'],
    ar_successCriteria: ['سجّل الدخول كـ admin@streamvault.io', 'استرجع العلم من /admin/dashboard'],
  },

  labInfo: {
    vulnType: 'Broken Authentication — No Rate Limiting / Credential Stuffing',
    ar_vulnType: 'Broken Authentication — لا rate limiting / حشو بيانات الاعتماد',
    cweId: 'CWE-307',
    cvssScore: 7.5,
    description: 'No rate limiting or lockout on login endpoint allows unlimited brute force attempts.',
    ar_description: 'غياب rate limiting وlockout يسمح بمحاولات قوة غاشمة غير محدودة.',
    whatYouLearn: [
      'How credential stuffing works using leaked password lists',
      'Why login endpoints must have rate limiting and account lockout',
      'How to detect and automate brute force against unprotected endpoints',
      'Mitigation: rate limiting + lockout + CAPTCHA + MFA',
    ],
    ar_whatYouLearn: [
      'كيف يعمل حشو بيانات الاعتماد باستخدام قوائم كلمات المرور المسرَّبة',
      'لماذا يجب أن تمتلك نقاط نهاية تسجيل الدخول rate limiting وaccount lockout',
      'كيفية اكتشاف وأتمتة القوة الغاشمة',
      'التخفيف: rate limiting + lockout + CAPTCHA + MFA',
    ],
    techStack: ['REST API', 'Node.js', 'JWT', 'bcrypt'],
    references: [
      { label: 'OWASP Broken Authentication', url: 'https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication' },
      { label: 'Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' },
      { label: 'CWE-307', url: 'https://cwe.mitre.org/data/definitions/307.html' },
    ],
  },

  goal: 'The target account is admin@streamvault.io. Use the provided leaked password list to brute force the login endpoint. There is no rate limiting, no lockout, and no CAPTCHA. Find the correct password and login to retrieve the flag.',
  ar_goal: 'الحساب المستهدف هو admin@streamvault.io. استخدم قائمة كلمات المرور المسرَّبة.',

  briefing: {
    en: 'StreamVault has no rate limiting or account lockout. Use the leaked password list to brute force admin@streamvault.io.',
    ar: 'StreamVault ليس لديها rate limiting أو account lockout. استخدم قائمة كلمات المرور المسرَّبة.',
  },

  stepsOverview: {
    en: [
      'GET /auth/leaked-passwords — retrieve the list of 15 leaked passwords',
      'POST /auth/login with each password until 200 OK',
      'Use JWT to access /admin/dashboard → flag',
    ],
    ar: [
      'GET /auth/leaked-passwords — احصل على 15 كلمة مرور',
      'POST /auth/login مع كل كلمة حتى 200 OK',
      'استخدم JWT للوصول إلى /admin/dashboard → العلم',
    ],
  },

  solution: {
    context: 'StreamVault /auth/login has zero protection: no rate limiting, no account lockout, no CAPTCHA. Admin password "Str3amV@ult2024!" is at position 10 in the leaked list.',
    vulnerableCode: "app.post('/auth/login', async (req, res) => {\n  // ❌ No rate limiting, no lockout\n  const user = await db.users.findOne({ email });\n  if (!user || !bcrypt.compareSync(password, user.passwordHash))\n    return res.status(401).json({ error: 'Invalid credentials' });\n  res.json({ token: generateJWT(user) });\n});",
    exploitation: 'Loop POST /auth/login with each password → 10th attempt succeeds → JWT → /admin/dashboard → flag',
    steps: {
      en: [
        'GET /auth/leaked-passwords → 15 passwords',
        'Loop POST /auth/login → 10th: "Str3amV@ult2024!" → 200 + JWT',
        'GET /admin/dashboard → FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
      ar: [
        'GET /auth/leaked-passwords → 15 كلمة',
        'حلقة POST /auth/login → الـ 10: "Str3amV@ult2024!" → 200 + JWT',
        'GET /admin/dashboard → FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
      ],
    },
    fix: ['Rate limiting: max 5 attempts/IP/15min', 'Account lockout after 10 failures', 'CAPTCHA after 3 failures', 'MFA'],
  },

  postSolve: {
    explanation: {
      en: 'No brute-force protection on login endpoint allows credential stuffing with any leaked password list.',
      ar: 'غياب حماية ضد القوة الغاشمة يتيح حشو بيانات الاعتماد.',
    },
    impact: {
      en: 'Admin takeover: full user database, billing info, content management.',
      ar: 'استيلاء على حساب الأدمن: قاعدة بيانات المستخدمين كاملة.',
    },
    fix: ['Rate limiting + exponential backoff', 'MFA', 'Anomaly detection', 'Leaked password check'],
  },

  hints: [
    { order: 1, xpCost: 10, ar_content: 'جرّب تسجيل الدخول عدة مرات — لاحظ لا تأخير ولا lockout.', content: 'Try logging in multiple times — notice no delay and no lockout.' },
    { order: 2, xpCost: 20, ar_content: 'استخدم GET /auth/leaked-passwords للحصول على القائمة.', content: 'Use GET /auth/leaked-passwords to get the list.' },
    { order: 3, xpCost: 35, ar_content: 'كرّر POST /auth/login مع كل كلمة مرور.', content: 'Loop POST /auth/login with each password from the list.' },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
  initialState: {
    users: [{ username: 'admin_streamvault', password: 'Str3amV@ult2024!', role: 'admin', email: 'admin@streamvault.io' }],
    contents: [{ title: 'LEAKED_PASSWORDS', body: JSON.stringify(['password123','admin1234','letmein!','qwerty2024','Summer2024!','Welcome1!','Pass@word1','Monkey123!','Dragon2024','Str3amV@ult2024!','Football99','Sunshine1!','shadow2024','master123!','iloveyou!1']), author: 'leaked_db', isPublic: true }],
  },
};
