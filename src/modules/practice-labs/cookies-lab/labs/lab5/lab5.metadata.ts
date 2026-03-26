// src/modules/practice-labs/cookies-lab/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 5 — Session Fixation
// Victim creds  : victim@lab.com / victim123
// Attack flow   : Send victim a link with ?session=KNOWN_ID → victim logs in →
//                 server reuses KNOWN_ID → attacker accesses dashboard with KNOWN_ID
// Flag          : FLAG{SESSION_FIXATION_ATTACK_SUCCESS}
// Route         : POST /practice-labs/cookies/lab5/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab5Metadata: LabMetadata = {
  slug:          'cookies-lab5-session-fixation',
  title:         'The Trap is Already Set',
  ar_title:      'الفخ مُعَدٌّ مسبقاً',
  description:
    'The server accepts a client-supplied session ID and binds the authenticated session to it. ' +
    'Pre-set a known session ID, force the victim to login, then use your pre-set ID to access their account.',
  ar_description:
    'يقبل الخادم معرّف جلسة يزوّده العميل ويربط الجلسة المصادقة به. ' +
    'حدّد معرّف جلسة معروفاً مسبقاً، اجبر الضحية على تسجيل الدخول، ثم استخدم معرّفك لدخول حسابها.',

  difficulty:    'INTERMEDIATE',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Session Fixation',
    'Session Management',
    'Authentication Bypass',
    'Cookie Security',
  ],

  xpReward:     130,
  pointsReward: 130,
  duration:     25,
  isPublished:  true,

  goal:    'Pre-set a session ID, trigger victim login with that ID, then access the dashboard using it.',
  ar_goal: 'حدّد معرّف جلسة مسبقاً، أجبر الضحية على تسجيل الدخول بهذا المعرّف، ثم ادخل لوحة التحكم باستخدامه.',

  flagAnswer: 'FLAG{SESSION_FIXATION_ATTACK_SUCCESS}',

  briefing: {
    en: 'The login endpoint accepts an optional presetSession parameter. ' +
        'If supplied, the server uses it as the session ID after authentication instead of generating a new one. ' +
        'You are the attacker. Can you hijack the victim session?',
    ar: 'تقبل نقطة نهاية تسجيل الدخول معامل presetSession اختيارياً. ' +
        'إذا تم توفيره، يستخدمه الخادم كمعرّف جلسة بعد المصادقة بدلاً من توليد معرّف جديد. ' +
        'أنت المهاجم. هل تستطيع اختطاف جلسة الضحية؟',
  },

  stepsOverview: {
    en: [
      'Choose any session ID you want — e.g. "attacker_fixed_session_123"',
      'Submit it as presetSession in the victim login panel',
      'The victim logs in with victim@lab.com / victim123',
      'The server binds the authenticated session to your pre-set ID',
      'Use the same ID in the Dashboard panel to access the victim account',
      'Capture the flag',
    ],
    ar: [
      'اختر أي معرّف جلسة تريده — مثلاً: "attacker_fixed_session_123"',
      'أرسله كـ presetSession في لوحة تسجيل دخول الضحية',
      'تسجيل دخول الضحية بـ victim@lab.com / victim123',
      'يربط الخادم الجلسة المصادقة بمعرّفك المحدد مسبقاً',
      'استخدم نفس المعرّف في لوحة Dashboard للوصول لحساب الضحية',
      'احصل على الفلاج',
    ],
  },

  solution: {
    context:
      'The server must ALWAYS generate a new session ID immediately after successful authentication. ' +
      'Reusing any pre-existing or client-supplied ID is the Session Fixation vulnerability.',
    vulnerableCode:
      'const sessionId = req.body.presetSession || generateId(); // ❌ reuses attacker ID\n' +
      'session.id = sessionId; // attacker already knows this value',
    exploitation:
      'Attacker sends victim a login link with their chosen session ID. ' +
      'Victim authenticates. Server binds auth to attacker-known ID. ' +
      'Attacker uses the known ID to impersonate the victim.',
    steps: {
      en: [
        'Choose presetSession = "my_fixed_id_999"',
        'POST /login with victim creds + presetSession="my_fixed_id_999"',
        'Server confirms sessionId = "my_fixed_id_999"',
        'POST /dashboard with sessionId="my_fixed_id_999" → receive FLAG',
      ],
      ar: [
        'اختر presetSession = "my_fixed_id_999"',
        'POST /login مع بيانات الضحية + presetSession="my_fixed_id_999"',
        'يؤكد الخادم sessionId = "my_fixed_id_999"',
        'POST /dashboard مع sessionId="my_fixed_id_999" → تلقي الفلاج',
      ],
    },
    fix: [
      'Always call session.regenerate() or create a brand new session ID immediately after successful login.',
      'Never accept session IDs from query strings, request bodies, or any client-controlled source.',
      'Invalidate any pre-authentication session completely upon successful login.',
      'Use cryptographically random session IDs with sufficient entropy (≥128 bits).',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Session fixation lets an attacker decide the session ID before the victim authenticates. ' +
          'Once the victim logs in, the attacker already has the valid session ID and can impersonate them.',
      ar: 'يتيح تثبيت الجلسة للمهاجم تحديد معرّف الجلسة قبل مصادقة الضحية. ' +
          'بمجرد تسجيل الضحية للدخول، يمتلك المهاجم مسبقاً معرّف الجلسة الصالح ويمكنه انتحال شخصيتها.',
    },
    impact: {
      en: 'Full session hijacking without needing to steal a cookie — the attacker already knows the session ID.',
      ar: 'اختطاف كامل للجلسة دون الحاجة لسرقة كوكيز — المهاجم يعرف معرّف الجلسة مسبقاً.',
    },
    fix: [
      'Regenerate session ID on every successful authentication.',
      'Ignore any session IDs supplied by the client before authentication.',
      'Implement strict session ID generation using cryptographic RNG.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'Notice the presetSession field in the login panel. What happens if you supply a value there?',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'Supply a custom string as presetSession and check if the server returns that same string as the session ID.',
      xpCost: 15,
    },
    {
      order:   3,
      content: 'After login, use the SAME presetSession value you chose to access the Dashboard endpoint.',
      xpCost: 25,
    },
  ],
};
