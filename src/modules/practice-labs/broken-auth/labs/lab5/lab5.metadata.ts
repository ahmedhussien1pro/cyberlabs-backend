// src/modules/practice-labs/broken-auth/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab5Metadata: LabMetadata = {
  slug: 'broken-auth-mfa-bypass-race-condition-banking',
  canonicalConceptId: 'broken-auth-mfa-race-condition',
  environmentType: 'BANKING_APP',
  title: 'Broken Auth: MFA Bypass — OTP Race Condition in Banking App',
  ar_title: 'Broken Auth: تجاوز MFA — Race Condition في OTP تطبيق البنك',
  description:
    'Exploit a broken MFA implementation in a banking app where the OTP verification endpoint is vulnerable to race conditions. Send multiple concurrent OTP verification requests simultaneously to bypass the attempt counter.',
  ar_description:
    'استغل تطبيق MFA مكسور في تطبيق بنكي حيث يكون endpoint التحقق من OTP عرضة لـ race conditions.',
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
    objective: 'Bypass SecureBank MFA by exploiting a race condition in the OTP endpoint. Fire 10 concurrent OTP guesses to defeat the 3-attempt lockout.',
    ar_objective: 'تجاوز MFA في SecureBank باستغلال race condition في endpoint التحقق من OTP. أطلق 10 تخمينات متزامنة.',
    successCriteria: ['Get a valid auth token from the race attack and access /banking/dashboard'],
    ar_successCriteria: ['احصل على توكن مصادقة صالح واصل إلى /banking/dashboard'],
  },

  labInfo: {
    vulnType: 'Broken Authentication — MFA Bypass via OTP Race Condition (TOCTOU)',
    ar_vulnType: 'Broken Authentication — تجاوز MFA عبر Race Condition في OTP',
    cweId: 'CWE-362',
    cvssScore: 9.0,
    description: 'Non-atomic read-check-write on OTP attempt counter allows concurrent requests to all pass the 3-attempt limit simultaneously.',
    ar_description: 'قراءة-فحص-كتابة غير ذرية على عداد محاولات OTP تسمح لطلبات متزامنة باجتياز حد المحاولات.',
    whatYouLearn: [
      'How non-atomic read-check-write enables race condition bypass of attempt counters',
      'TOCTOU (Time-Of-Check-To-Time-Of-Use) pattern in authentication',
      'Why sequential testing of security controls can miss concurrency vulnerabilities',
      'Mitigation: atomic DB operations (SELECT FOR UPDATE) or Redis INCR',
    ],
    ar_whatYouLearn: [
      'كيف تمكّن القراءة-الفحص-الكتابة غير الذرية من تجاوز عدادات المحاولة',
      'نمط TOCTOU في المصادقة',
      'لماذا قد يفوت الاختبار التسلسلي ثغرات التزامن',
      'التخفيف: عمليات DB ذرية أو Redis INCR',
    ],
    techStack: ['REST API', 'Node.js', 'Banking App', 'OTP', 'Race Condition'],
    references: [
      { label: 'OWASP Race Condition', url: 'https://owasp.org/www-community/attacks/Race_condition' },
      { label: 'PortSwigger Race Conditions', url: 'https://portswigger.net/web-security/race-conditions' },
      { label: 'CWE-362', url: 'https://cwe.mitre.org/data/definitions/362.html' },
    ],
  },

  goal: 'Login as a bank customer — the server requires OTP. The OTP check has a race condition. Send parallel OTP guesses to bypass the 3-attempt limit and access the premium banking dashboard.',
  ar_goal: 'سجّل الدخول كعميل بنك — الخادم يتطلب OTP. فحص OTP به race condition. أرسل تخمينات OTP متوازية لتجاوز حد المحاولات.',

  briefing: {
    en: 'SecureBank OTP: 6 digits, 3 attempts, then lockout. Sequential brute force: impossible. But concurrent? if (session.otpAttempts >= 3) return 429; then await db.update(+1). Non-atomic. 10 concurrent requests all read 0. All pass. One hits the right OTP.',
    ar: 'SecureBank OTP: 6 أرقام، 3 محاولات، ثم lockout. قوة غاشمة تسلسلية: مستحيلة. لكن متزامنة؟ if (session.otpAttempts >= 3) return 429; ثم await db.update(+1). غير ذري. 10 طلبات تقرأ كلها 0. كلها تجتاز. واحدة تصيب.',
  },

  stepsOverview: {
    en: [
      'POST /auth/login → requires OTP, get sessionId',
      'Try 3 sequential wrong OTPs → locked out on 4th',
      'Understand race condition: non-atomic check allows concurrent bypass',
      'POST /auth/race-otp-attack { "sessionId": "<id>", "otpGuesses": [...10 guesses...] }',
      'One returns 200 + auth token → GET /banking/dashboard → flag',
    ],
    ar: [
      'POST /auth/login → يتطلب OTP، احصل sessionId',
      'جرّب 3 أكواد خاطئة → lockout',
      'افهم race condition',
      'POST /auth/race-otp-attack → 10 طلبات متزامنة',
      'واحدة تُعيد 200 + توكن → GET /banking/dashboard → العلم',
    ],
  },

  solution: {
    context: 'Non-atomic read-check-write on attempt counter. 10 concurrent requests all read 0, all pass the >= 3 check before any write completes.',
    vulnerableCode:
      "app.post('/auth/verify-otp', async (req, res) => {\n" +
      '  const session = await db.sessions.findOne({ id: req.body.sessionId });\n' +
      '  // \u274c Race condition: NOT atomic\n' +
      "  if (session.otpAttempts >= 3) return res.status(429).json({ error: 'Too many attempts' });\n" +
      '  await db.sessions.update({ otpAttempts: session.otpAttempts + 1 });\n' +
      "  if (req.body.otp === session.expectedOtp) return res.json({ success: true, token: generateFullToken(session) });\n" +
      "  res.json({ error: 'Invalid OTP' });\n" +
      '});',
    exploitation: '1. Login \u2192 sessionId\n2. POST /auth/race-otp-attack with 10 concurrent guesses\n3. One hits correct OTP \u2192 token \u2192 /banking/dashboard \u2192 flag',
    steps: {
      en: [
        'POST /auth/login \u2192 { "sessionId": "sess_xyz", "requiresOtp": true }',
        'POST /auth/race-otp-attack { "sessionId": "sess_xyz", "otpGuesses": ["111111","222222","333333","444444","555555","666666","777777","888888","999999","000000"] }',
        'One response: { "success": true, "token": "eyJ..." }',
        'GET /banking/dashboard \u2192 FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
      ar: [
        'POST /auth/login \u2192 { "sessionId": "sess_xyz"\u060c "requiresOtp": true }',
        'POST /auth/race-otp-attack \u2192 10 \u062a\u062e\u0645\u064a\u0646\u0627\u062a',
        '\u0648\u0627\u062d\u062f\u0629: { "success": true\u060c "token": "eyJ..." }',
        'GET /banking/dashboard \u2192 FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
      ],
    },
    fix: [
      'Atomic DB: UPDATE sessions SET attempts=attempts+1 WHERE id=? AND attempts < 3',
      'DB transaction with serializable isolation',
      'Redis INCR: atomic by nature',
      'SELECT FOR UPDATE: pessimistic row locking',
    ],
  },

  postSolve: {
    explanation: {
      en: 'TOCTOU race condition: state changes between check and enforcement. OTP limit works sequentially \u2014 fails completely with concurrent requests.',
      ar: 'Race condition TOCTOU: \u062a\u062a\u063a\u064a\u0651\u0631 \u0627\u0644\u062d\u0627\u0644\u0629 \u0628\u064a\u0646 \u0627\u0644\u0641\u062d\u0635 \u0648\u0627\u0644\u062a\u0637\u0628\u064a\u0642. \u062d\u062f OTP \u064a\u0639\u0645\u0644 \u062a\u0633\u0644\u0633\u0644\u064a\u0627\u064b \u2014 \u064a\u0641\u0634\u0644 \u0645\u0639 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u062a\u0632\u0627\u0645\u0646\u0629.',
    },
    impact: {
      en: 'MFA bypass on banking: $75,000 account takeover, transaction history, wire transfers.',
      ar: '\u062a\u062c\u0627\u0648\u0632 MFA \u0641\u064a \u0628\u0646\u0643: \u0627\u0633\u062a\u064a\u0644\u0627\u0621 \u0639\u0644\u0649 \u062d\u0633\u0627\u0628 75,000$.',
    },
    fix: [
      'Atomic DB increment: UPDATE ... WHERE attempts < 3',
      'Redis SETNX distributed lock',
      'TOTP (RFC 6238) rolling windows',
      'WebAuthn/FIDO2: immune to this attack',
    ],
  },

  hints: [
    { order: 1, xpCost: 25, ar_content: 'سجّل الدخول → تحتاج OTP. جرّب 3 أكواد خاطئة تسلسلياً → lockout. ماذا لو وصلت طلبات متعددة في نفس الميليثانية؟', content: 'Login → need OTP. Try 3 wrong OTPs sequentially → lockout. What if multiple requests arrive simultaneously?' },
    { order: 2, xpCost: 50, ar_content: 'Race condition: 10 طلبات تصل قبل أول كتابة DB. كلها تقرأ otpAttempts=0. كلها تجتاز. read-check-write غير ذري.', content: 'Race condition: 10 requests before first DB write. All read 0. All pass check. Non-atomic read-check-write.' },
    { order: 3, xpCost: 80, ar_content: 'استخدم /auth/race-otp-attack { "sessionId": "<your_session>"، "otpGuesses": ["111111"،...،"000000"] }.', content: 'Use /auth/race-otp-attack { "sessionId": "<your_session>", "otpGuesses": ["111111",...,"000000"] }.' },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
  initialState: {
    users: [{ username: 'customer_laila', password: 'laila123', role: 'customer', email: 'laila@securebank.io' }],
    banks: [{ accountNo: 'BANK-LAILA-001', balance: 75000, ownerName: 'Laila Ibrahim' }],
  },
};
