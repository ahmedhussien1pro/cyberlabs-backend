// src/modules/practice-labs/broken-auth/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab5Metadata: LabMetadata = {
  slug: 'broken-auth-mfa-bypass-race-condition-banking',
  title: 'Broken Auth: MFA Bypass — OTP Race Condition in Banking App',
  ar_title: 'Broken Auth: تجاوز MFA — Race Condition في OTP تطبيق البنك',
  description:
    'Exploit a broken MFA implementation in a banking app where the OTP verification endpoint is vulnerable to race conditions. By sending multiple concurrent OTP verification requests simultaneously, you bypass the attempt counter and brute-force the 6-digit OTP within a single time window.',
  ar_description:
    'استغل تطبيق MFA مكسور في تطبيق بنكي حيث يكون endpoint التحقق من OTP عرضة لـ race conditions. بإرسال طلبات تحقق OTP متعددة ومتزامنة في آنٍ واحد، تتجاوز عداد المحاولات وتخمن رمز OTP المكون من 6 أرقام خلال نافذة زمنية واحدة.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Race Condition',
    'MFA Bypass',
    'OTP Brute Force',
    'Concurrent Requests',
    'Banking Security',
  ],
  xpReward: 420,
  pointsReward: 210,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Login as a bank customer — the server requires a 6-digit OTP. The OTP check has a race condition: concurrent requests are processed before the attempt counter increments. Send parallel OTP guesses to bypass the 3-attempt limit and access the premium banking dashboard.',
  ar_goal:
    'سجّل الدخول كعميل بنك — يتطلب الخادم OTP مكوناً من 6 أرقام. فحص OTP به race condition: الطلبات المتزامنة تُعالَج قبل زيادة عداد المحاولات. أرسل تخمينات OTP متوازية لتجاوز حد المحاولات الـ 3 والوصول للوحة تحكم البنكية المميزة.',

  briefing: {
    en: `SecureBank — mobile banking app. Transfers, investments, account management.
customer_laila. $75,000 balance.
She logs in with correct credentials.
"Please enter your 6-digit OTP."
The OTP is 6 digits. 000000 to 999999. 1,000,000 possibilities.
The endpoint allows 3 attempts. Then it locks.
Sequential brute force: impossible. 3 attempts. 30-second window.
But what about concurrent requests?
You read the code.
The counter check: if (session.otpAttempts >= 3) return 429.
Then: await db.sessions.update(otpAttempts + 1).
A non-atomic read-modify-write.
If 10 requests arrive at the same time —
All 10 read otpAttempts = 0.
All 10 pass the check.
All 10 try their OTP.
You need the right one to be among them.
10 guesses in one burst.
That's enough.`,
    ar: `SecureBank — تطبيق مصرفي على الجوال. تحويلات، استثمارات، إدارة الحسابات.
customer_laila. رصيد 75,000$.
تسجّل الدخول ببيانات اعتماد صحيحة.
"أدخل رمز OTP المكوَّن من 6 أرقام."
رمز OTP 6 أرقام. من 000000 إلى 999999. مليون احتمال.
يسمح الـ endpoint بـ 3 محاولات. ثم يُقفل.
القوة الغاشمة التسلسلية: مستحيلة. 3 محاولات. نافذة 30 ثانية.
لكن ماذا عن الطلبات المتزامنة؟
تقرأ الكود.
فحص العداد: if (session.otpAttempts >= 3) return 429.
ثم: await db.sessions.update(otpAttempts + 1).
قراءة-تعديل-كتابة غير ذرية.
إذا وصلت 10 طلبات في نفس الوقت —
كلها الـ 10 تقرأ otpAttempts = 0.
كلها الـ 10 تجتاز الفحص.
كلها الـ 10 تجرب OTP الخاص بها.
تحتاج الصحيح أن يكون بينهم.
10 تخمينات في ضربة واحدة.
هذا كافٍ.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/login { "email": "laila@securebank.io", "password": "laila123" } → 200 but requires OTP → receive sessionId',
      'POST /auth/verify-otp { "sessionId": "<id>", "otp": "000001" } → try 3 sequential → get locked out on 4th → confirm counter works sequentially',
      'Understand race condition: non-atomic read-check-increment allows concurrent bypass',
      'POST /auth/race-otp-attack { "sessionId": "<id>", "otpGuesses": ["123456", "234567", ..., "999999"] } — 10 concurrent requests fire simultaneously',
      'One request returns 200 + full auth token → GET /banking/dashboard → flag',
    ],
    ar: [
      'POST /auth/login { "email": "laila@securebank.io"، "password": "laila123" } → 200 لكن يتطلب OTP → استلم sessionId',
      'POST /auth/verify-otp { "sessionId": "<id>"، "otp": "000001" } → جرب 3 تسلسلياً → احصل على lockout عند الـ 4 → أكّد أن العداد يعمل تسلسلياً',
      'افهم race condition: القراءة-الفحص-الزيادة غير الذرية تسمح بالتجاوز المتزامن',
      'POST /auth/race-otp-attack { "sessionId": "<id>"، "otpGuesses": ["123456"، "234567"، ...، "999999"] } — 10 طلبات متزامنة تُطلَق في آنٍ واحد',
      'يُعيد طلب واحد 200 + توكن مصادقة كامل → GET /banking/dashboard → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SecureBank OTP verification has a non-atomic read-check-write on the attempt counter. The database reads otpAttempts=0, checks if >= 3 (false), then schedules an async update to increment. If 10 requests arrive within the same event loop tick before any write completes, all 10 pass the check simultaneously. This allows effectively unlimited OTP guesses in a single burst, bypassing the 3-attempt lockout.',
    vulnerableCode:
      '// OTP verification (vulnerable race condition):\n' +
      "app.post('/auth/verify-otp', async (req, res) => {\n" +
      '  const session = await db.sessions.findOne({ id: req.body.sessionId });\n\n' +
      '  // ❌ Race condition: check and increment are NOT atomic\n' +
      '  if (session.otpAttempts >= 3) {\n' +
      "    return res.status(429).json({ error: 'Too many attempts' });\n" +
      '  }\n\n' +
      '  // ❌ Multiple concurrent requests ALL pass this check before increment!\n' +
      '  await db.sessions.update({ id: session.id, otpAttempts: session.otpAttempts + 1 });\n\n' +
      '  if (req.body.otp === session.expectedOtp) {\n' +
      '    return res.json({ success: true, token: generateFullToken(session) });\n' +
      '  }\n' +
      "  res.json({ error: 'Invalid OTP' });\n" +
      '});',
    exploitation:
      '1. Login → get sessionId\n' +
      '2. POST /auth/race-otp-attack { "sessionId": "<id>", "otpGuesses": ["111111","222222","333333","444444","555555","666666","777777","888888","999999","000000"] }\n' +
      '3. All 10 fire simultaneously → all read otpAttempts=0 → all pass check → one hits the correct OTP → full token returned\n' +
      '4. GET /banking/dashboard with token → flag',
    steps: {
      en: [
        'POST /auth/login → { "sessionId": "sess_xyz123", "requiresOtp": true }',
        'POST /auth/verify-otp { "sessionId": "sess_xyz123", "otp": "000001" } × 3 → locked out on 4th (confirms sequential counter works)',
        'POST /auth/race-otp-attack { "sessionId": "sess_new", "otpGuesses": ["111111","222222",...,"000000"] } → concurrent burst',
        'Response: one returns { "success": true, "token": "eyJ..." } → GET /banking/dashboard → flag: FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
      ar: [
        'POST /auth/login → { "sessionId": "sess_xyz123"، "requiresOtp": true }',
        'POST /auth/verify-otp { "sessionId": "sess_xyz123"، "otp": "000001" } × 3 → lockout عند الـ 4 (يؤكد أن العداد التسلسلي يعمل)',
        'POST /auth/race-otp-attack { "sessionId": "sess_new"، "otpGuesses": ["111111"، "222222"، ...، "000000"] } → اندفاع متزامن',
        'الاستجابة: واحدة تُعيد { "success": true، "token": "eyJ..." } → GET /banking/dashboard → العلم: FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
    },
    fix: [
      'Atomic counter: use database-level atomic increment and check: UPDATE sessions SET otp_attempts = otp_attempts + 1 WHERE id = ? AND otp_attempts < 3 → check rows_affected: if 0, reject immediately',
      'Database transaction: wrap read-check-increment in a serializable transaction — prevents concurrent reads seeing stale values',
      'Redis atomic operations: use INCR + EXPIRE in Redis for attempt counting — Redis INCR is atomic by nature',
      'Pessimistic locking: SELECT FOR UPDATE on the session row — locks the row during read-update, preventing concurrent access',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Race conditions in authentication are among the most severe class of vulnerabilities because they defeat controls that appear to work in sequential testing. The OTP limit of 3 works perfectly when requests are sent one at a time — it fails completely when 10 requests arrive within a single database read cycle. This is a classic TOCTOU (Time-Of-Check-To-Time-Of-Use) race condition: the state changes between the check and the enforcement.',
      ar: 'تُعدّ Race conditions في المصادقة من أشد فئات الثغرات خطورة لأنها تهزم ضوابط تبدو أنها تعمل في الاختبار التسلسلي. حد OTP من 3 يعمل بشكل مثالي عند إرسال الطلبات واحداً تلو الآخر — يفشل تماماً عند وصول 10 طلبات خلال دورة قراءة قاعدة بيانات واحدة. هذا هو race condition الكلاسيكي TOCTOU (Time-Of-Check-To-Time-Of-Use): تتغير الحالة بين الفحص والتطبيق.',
    },
    impact: {
      en: 'MFA bypass on a banking application: complete account takeover of a $75,000 balance account, full transaction history access, wire transfer capability. MFA is the last line of defense after password compromise — bypassing it eliminates the entire second factor of authentication for any attacker willing to send concurrent requests.',
      ar: 'تجاوز MFA في تطبيق بنكي: استيلاء كامل على حساب برصيد 75,000$، وصول كامل لسجل المعاملات، إمكانية التحويل البنكي. MFA هو خط الدفاع الأخير بعد اختراق كلمة المرور — تجاوزه يُلغي العامل الثاني الكامل للمصادقة لأي مهاجم على استعداد لإرسال طلبات متزامنة.',
    },
    fix: [
      'Atomic database operations: the only correct fix — use DB-level atomic increment (SQL: UPDATE ... WHERE attempts < 3) or Redis INCR',
      'Distributed locking: for multi-server deployments, use Redis SETNX as a distributed mutex on the session during OTP verification',
      'Time-based OTP (TOTP): use TOTP standards (RFC 6238) with rolling 30-second windows — even with race condition, window limits exposure',
      'Hardware-backed MFA: push notifications (WebAuthn/FIDO2) or authenticator apps are immune to this class of attack',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Login successfully → you need OTP. Try 3 wrong OTPs sequentially — you get locked out. But think: what if multiple requests arrive at the same millisecond? Does the counter check handle that?',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'Race condition: if 10 requests all arrive before the first DB write completes, they ALL read otpAttempts=0. They all pass the "< 3" check. This is a non-atomic read-check-write.',
    },
    {
      order: 3,
      xpCost: 80,
      content:
        'Use /auth/race-otp-attack { "sessionId": "<your_session>", "otpGuesses": ["111111","222222","333333","444444","555555","666666","777777","888888","999999","000000"] } to fire 10 guesses simultaneously.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
  initialState: {
    users: [
      {
        username: 'customer_laila',
        password: 'laila123',
        role: 'customer',
        email: 'laila@securebank.io',
      },
    ],
    banks: [
      {
        accountNo: 'BANK-LAILA-001',
        balance: 75000,
        ownerName: 'Laila Ibrahim',
      },
    ],
  },
};
