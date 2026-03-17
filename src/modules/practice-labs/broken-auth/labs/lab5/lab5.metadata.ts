// src/modules/practice-labs/broken-auth/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab5Metadata: LabMetadata = {
  slug: 'broken-auth-mfa-bypass-race-condition-banking',
  canonicalConceptId: 'broken-auth-mfa-race-condition',
  environmentType: 'BANKING_APP',
  title: 'Broken Auth: MFA Bypass — OTP Race Condition in Banking App',
  ar_title: 'Broken Auth: تجاوز MFA — Race Condition في OTP تطبيق البنك',
  description:
    'Exploit a broken MFA implementation in a banking app where the OTP verification endpoint is vulnerable to race conditions. Send multiple concurrent OTP verification requests simultaneously to bypass the attempt counter and brute-force the 6-digit OTP.',
  ar_description:
    'استغل تطبيق MFA مكسور في تطبيق بنكي حيث يكون endpoint التحقق من OTP عرضة لـ race conditions. أرسل طلبات تحقق متعددة ومتزامنة لتجاوز عداد المحاولات.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['Broken Authentication', 'Race Condition', 'MFA Bypass', 'OTP Brute Force', 'Concurrent Requests', 'Banking Security'],
  xpReward: 420,
  pointsReward: 210,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION PARALLEL STORM',
    classification: 'TOP_SECRET',
    objective: {
      en: 'Bypass SecureBank MFA by exploiting a race condition in the OTP verification endpoint. Fire 10 concurrent OTP guesses in a single burst to defeat the 3-attempt lockout and access the banking dashboard.',
      ar: 'تجاوز MFA في SecureBank باستغلال race condition في endpoint التحقق من OTP. أطلق 10 تخمينات OTP متزامنة في ضربة واحدة لتجاوز قفل المحاولات الـ 3.',
    },
    successCriteria: {
      en: 'Get a valid auth token from the race attack and access /banking/dashboard.',
      ar: 'احصل على توكن مصادقة صالح من هجوم race واصل إلى /banking/dashboard.',
    },
  },

  labInfo: {
    vulnType: 'Broken Authentication — MFA Bypass via OTP Race Condition (TOCTOU)',
    cweId: 'CWE-362',
    cvssScore: 9.0,
    whatYouLearn: {
      en: [
        'How non-atomic read-check-write enables race condition bypass of attempt counters',
        'TOCTOU (Time-Of-Check-To-Time-Of-Use) pattern in authentication',
        'Why sequential testing of security controls can miss concurrency vulnerabilities',
        'Mitigation: atomic DB operations (SELECT FOR UPDATE) or Redis INCR',
      ],
      ar: [
        'كيف تمكّن القراءة-الفحص-الكتابة غير الذرية من تجاوز عدادات المحاولة عبر race condition',
        'نمط TOCTOU في المصادقة',
        'لماذا قد يفوت الاختبار التسلسلي لضوابط الأمان ثغرات التزامن',
        'التخفيف: عمليات DB ذرية (SELECT FOR UPDATE) أو Redis INCR',
      ],
    },
    techStack: ['REST API', 'Node.js', 'Banking App', 'OTP', 'Race Condition'],
    references: [
      'https://owasp.org/www-community/attacks/Race_condition',
      'https://portswigger.net/web-security/race-conditions',
      'https://cwe.mitre.org/data/definitions/362.html',
    ],
  },

  goal: 'Login as a bank customer — the server requires OTP. The OTP check has a race condition. Send parallel OTP guesses to bypass the 3-attempt limit and access the premium banking dashboard.',
  ar_goal:
    'سجّل الدخول كعميل بنك — الخادم يتطلب OTP. فحص OTP به race condition. أرسل تخمينات OTP متوازية لتجاوز حد المحاولات الـ 3.',

  briefing: {
    en: `SecureBank — mobile banking. Transfers, investments, account management.
customer_laila. $75,000 balance.
Logs in with correct credentials.
"Enter your 6-digit OTP."
6 digits. 1,000,000 possibilities. 3 attempts allowed. Then lockout.
Sequential brute force: impossible.
But concurrent requests?
if (session.otpAttempts >= 3) return 429;
await db.sessions.update(otpAttempts + 1);
Non-atomic read-modify-write.
10 requests arrive simultaneously.
All 10 read otpAttempts = 0.
All 10 pass the check.
10 guesses in one burst.
That's enough.`,
    ar: `SecureBank — مصرفية على الجوال. تحويلات، استثمارات، إدارة الحسابات.
customer_laila. رصيد 75,000$.
"أدخل رمز OTP المكوَّن من 6 أرقام."
6 أرقام. مليون احتمال. 3 محاولات فقط.
if (session.otpAttempts >= 3) return 429;
await db.sessions.update(otpAttempts + 1);
قراءة-تعديل-كتابة غير ذرية.
10 طلبات تصل في نفس الوقت.
كلها تقرأ otpAttempts = 0.
10 تخمينات في ضربة واحدة.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/login { "email": "laila@securebank.io", "password": "laila123" } → requires OTP, get sessionId',
      'Try 3 sequential wrong OTPs → locked out on 4th → confirm sequential counter works',
      'Understand race condition: non-atomic read-check-increment allows concurrent bypass',
      'POST /auth/race-otp-attack { "sessionId": "<id>", "otpGuesses": ["111111",...,"000000"] } → 10 concurrent',
      'One returns 200 + full auth token → GET /banking/dashboard → flag',
    ],
    ar: [
      'POST /auth/login → يتطلب OTP، احصل على sessionId',
      'جرّب 3 أكواد OTP خاطئة تسلسلياً → lockout عند الـ 4',
      'افهم race condition: القراءة-الفحص-الزيادة غير الذرية',
      'POST /auth/race-otp-attack → 10 طلبات متزامنة',
      'واحدة تُعيد 200 + توكن → GET /banking/dashboard → العلم',
    ],
  },

  solution: {
    context:
      'Non-atomic read-check-write on attempt counter. 10 concurrent requests all read otpAttempts=0, all pass the >= 3 check before any write completes.',
    vulnerableCode:
      "app.post('/auth/verify-otp', async (req, res) => {\n" +
      '  const session = await db.sessions.findOne({ id: req.body.sessionId });\n' +
      '  // ❌ Race condition: check and increment are NOT atomic\n' +
      '  if (session.otpAttempts >= 3) return res.status(429).json({ error: \'Too many attempts\' });\n' +
      '  await db.sessions.update({ otpAttempts: session.otpAttempts + 1 });\n' +
      '  if (req.body.otp === session.expectedOtp) return res.json({ success: true, token: generateFullToken(session) });\n' +
      '  res.json({ error: \'Invalid OTP\' });\n' +
      '});',
    exploitation:
      '1. Login → sessionId\n2. POST /auth/race-otp-attack with 10 concurrent guesses\n3. One hits correct OTP → full token → GET /banking/dashboard → flag',
    steps: {
      en: [
        'POST /auth/login → { "sessionId": "sess_xyz", "requiresOtp": true }',
        'POST /auth/race-otp-attack { "sessionId": "sess_xyz", "otpGuesses": ["111111","222222","333333","444444","555555","666666","777777","888888","999999","000000"] }',
        'One response: { "success": true, "token": "eyJ..." }',
        'GET /banking/dashboard → FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
      ar: [
        'POST /auth/login → { "sessionId": "sess_xyz"، "requiresOtp": true }',
        'POST /auth/race-otp-attack { "sessionId": "sess_xyz"، "otpGuesses": ["111111",...,"000000"] }',
        'استجابة واحدة: { "success": true، "token": "eyJ..." }',
        'GET /banking/dashboard → FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
    },
    fix: [
      'Atomic DB: UPDATE sessions SET attempts = attempts+1 WHERE id=? AND attempts < 3 — check rows_affected',
      'DB transaction with serializable isolation',
      'Redis INCR: atomic by nature',
      'SELECT FOR UPDATE: pessimistic row locking',
    ],
  },

  postSolve: {
    explanation: {
      en: 'TOCTOU race condition: the state changes between check and enforcement. The OTP limit works perfectly sequentially — fails completely with concurrent requests.',
      ar: 'Race condition TOCTOU: تتغيّر الحالة بين الفحص والتطبيق. حد OTP يعمل مثالياً تسلسلياً — يفشل تماماً مع الطلبات المتزامنة.',
    },
    impact: {
      en: 'MFA bypass on banking: $75,000 account takeover, transaction history, wire transfers. MFA is the last defense after password compromise.',
      ar: 'تجاوز MFA في بنك: استيلاء على حساب 75,000$، سجل المعاملات، إمكانية التحويل.',
    },
    fix: [
      'Atomic DB increment: only correct fix',
      'Redis SETNX distributed lock for multi-server deployments',
      'TOTP (RFC 6238) with 30-second rolling windows',
      'WebAuthn/FIDO2: immune to this attack class',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      ar_content: 'سجّل الدخول بنجاح → تحتاج OTP. جرّب 3 أكواد خاطئة تسلسلياً → lockout. لكن ماذا لو وصلت طلبات متعددة في نفس الميليثانية؟ هل يتعامل العداد مع ذلك؟',
      content: 'Login → need OTP. Try 3 wrong OTPs sequentially → lockout. But what if multiple requests arrive at the same millisecond? Does the counter handle that?',
    },
    {
      order: 2,
      xpCost: 50,
      ar_content: 'Race condition: إذا وصلت 10 طلبات قبل اكتمال أول كتابة DB، كلها تقرأ otpAttempts=0. كلها تجتاز فحص "< 3". هذا هو read-check-write غير ذري.',
      content: 'Race condition: if 10 requests arrive before first DB write completes, all read otpAttempts=0. All pass "< 3" check. Non-atomic read-check-write.',
    },
    {
      order: 3,
      xpCost: 80,
      ar_content: 'استخدم /auth/race-otp-attack { "sessionId": "<your_session>"، "otpGuesses": ["111111"،"222222"،"333333"،"444444"،"555555"،"666666"،"777777"،"888888"،"999999"،"000000"] } لإطلاق 10 تخمينات متزامنة.',
      content: 'Use /auth/race-otp-attack { "sessionId": "<your_session>", "otpGuesses": ["111111","222222","333333","444444","555555","666666","777777","888888","999999","000000"] } to fire 10 guesses simultaneously.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
  initialState: {
    users: [
      { username: 'customer_laila', password: 'laila123', role: 'customer', email: 'laila@securebank.io' },
    ],
    banks: [
      { accountNo: 'BANK-LAILA-001', balance: 75000, ownerName: 'Laila Ibrahim' },
    ],
  },
};
