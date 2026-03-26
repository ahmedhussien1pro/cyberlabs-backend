// src/modules/practice-labs/cookies-lab/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 3 — Session Fixation
// Attack flow : Attacker plants a known session ID → victim logs in →
//               server keeps the same session ID → attacker reuses it.
// Flag        : FLAG{SESSION_FIXATION_EXPLOITED}
// Route       : POST /practice-labs/cookies/lab3/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab3Metadata: LabMetadata = {
  slug:          'cookies-lab3-session-fixation',
  title:         'Session Fixation',
  ar_title:      'تثبيت الجلسة',
  description:
    'The server accepts a pre-set sessionId from the client before authentication and keeps it after login. ' +
    'Exploit this to hijack an authenticated session without knowing the victim\'s password.',
  ar_description:
    'يقبل الخادم معرّف جلسة محدّداً مسبقاً من العميل قبل المصادقة ويحتفظ به بعد تسجيل الدخول. ' +
    'استغل هذا لاختطاف جلسة مصادق عليها دون معرفة كلمة مرور الضحية.',

  difficulty:    'INTERMEDIATE',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Session Fixation',
    'Cookie Manipulation',
    'Session Hijacking',
    'Authentication Bypass',
  ],

  xpReward:     120,
  pointsReward: 120,
  duration:     25,
  isPublished:  false, // TODO: enable when lab3 backend is complete

  goal:    'Plant a known sessionId before the victim logs in, wait for authentication, then use that sessionId to access the admin panel.',
  ar_goal: 'زرع معرّف جلسة معروف قبل تسجيل دخول الضحية، انتظر المصادقة، ثمّ استخدم نفس المعرّف للوصول إلى لوحة التحكّم.',

  flagAnswer: 'FLAG{SESSION_FIXATION_EXPLOITED}',

  briefing: {
    en: 'This app lets you set the sessionId cookie before logging in. ' +
        'After a successful login the server does NOT regenerate the session ID. ' +
        'This means if you plant a known ID, you can reuse it after the victim authenticates. ' +
        'In this simulated lab you play both attacker and victim.',
    ar: 'يتيح هذا التطبيق تحديد كوكيز sessionId قبل تسجيل الدخول. ' +
        'بعد تسجيل الدخول الناجح، لا يُعيد الخادم توليد معرّف الجلسة. ' +
        'هذا يعني أنّك إذا زرعت معرّفاً معروفاً، يمكنك إعادة استخدامه بعد مصادقة الضحية.',
  },

  stepsOverview: {
    en: [
      'Generate a known sessionId (e.g. "ATTACKER_SESSION_001")',
      'Plant it via the /pre-auth endpoint before logging in',
      'Login with the victim credentials using the fixed sessionId',
      'The server authenticates but keeps the same sessionId',
      'Use the planted sessionId to access /admin as the authenticated user',
    ],
    ar: [
      'أنشئ معرّف جلسة معروف (مثلاً: "ATTACKER_SESSION_001")',
      'ازرعه عبر نقطة النهاية /pre-auth قبل تسجيل الدخول',
      'سجّل دخولاً ببيانات اعتماد الضحية باستخدام معرّف الجلسة المثبت',
      'يصادق الخادم لكنه يحتفظ بنفس معرّف الجلسة',
      'استخدم معرّف الجلسة المزروع للوصول إلى /admin كمستخدم مصادق',
    ],
  },

  solution: {
    context:
      'Server accepts a sessionId header on /pre-auth and creates a session record. ' +
      'On /login it authenticates the user but does NOT call session.regenerate(). ' +
      'The attacker\'s planted ID is now bound to an authenticated session.',
    vulnerableCode:
      '// ❌ Missing: session.regenerate() after successful login\n' +
      'req.session.userId = user.id; // keeps the attacker-controlled sessionId',
    exploitation:
      'POST /pre-auth sessionId=ATTACK_ID → POST /login (victim) → POST /admin sessionId=ATTACK_ID → admin access.',
    steps: {
      en: [
        'POST /pre-auth { sessionId: "ATTACK_ID" } → server stores session',
        'POST /login { email, password, sessionId: "ATTACK_ID" } → authenticated, same ID kept',
        'POST /admin with header x-session: ATTACK_ID → server finds authenticated session → FLAG',
      ],
      ar: [
        'POST /pre-auth { sessionId: "ATTACK_ID" } → يخزّن الخادم الجلسة',
        'POST /login { email, password, sessionId: "ATTACK_ID" } → مصادق، نفس المعرّف محتفظ',
        'POST /admin مع x-session: ATTACK_ID → يجد الخادم جلسة مصادقة → الفلاج',
      ],
    },
    fix: [
      'Always call session.regenerate() immediately after a successful login.',
      'Never accept a client-provided session ID before authentication.',
      'Use cryptographically random, sufficiently long session IDs (128+ bits).',
      'Bind sessions to IP address and User-Agent for extra protection.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Session Fixation allows an attacker to control the session ID a victim will use. ' +
          'If the server does not regenerate the session ID after login, ' +
          'the attacker\'s pre-planted ID becomes a valid authenticated session.',
      ar: 'يتيح تثبيت الجلسة للمهاجم التحكّم في معرّف الجلسة الذي ستستخدمه الضحية. ' +
          'إذا لم يُعيد الخادم توليد المعرّف بعد تسجيل الدخول، يصبح المعرّف المزروع مسبقاً جلسةً مصادقاً عليها.',
    },
    impact: {
      en: 'Full session hijacking without knowing the victim\'s password. Attacker gains complete access to the victim\'s account.',
      ar: 'اختطاف جلسة كامل دون معرفة كلمة مرور الضحية. يحصل المهاجم على وصول كامل لحساب الضحية.',
    },
    fix: [
      'session.regenerate() after every successful login — no exceptions.',
      'Invalidate pre-auth sessions that were not used within 60 seconds.',
      'Use secure, HttpOnly, SameSite=Strict session cookies.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'Before logging in, try sending a custom sessionId to /pre-auth. Does the server accept it?',
      xpCost: 10,
    },
    {
      order:   2,
      content: 'After login the session ID stays the same. What happens if you use the sessionId you planted before login on /admin?',
      xpCost: 25,
    },
    {
      order:   3,
      content: 'POST /pre-auth with sessionId="MY_ID" → POST /login (same sessionId) → POST /admin with x-session: MY_ID → flag.',
      xpCost: 40,
    },
  ],
};
