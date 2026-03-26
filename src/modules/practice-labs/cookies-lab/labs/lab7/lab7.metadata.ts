// src/modules/practice-labs/cookies-lab/labs/lab7/lab7.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 7 — Predictable Session ID
// Credentials : user@lab.com / password123
// Pattern     : sess_<role>_<sequential_counter> → admin session = sess_admin_1
// Flag        : FLAG{PREDICTABLE_SESSION_ID_EXPLOITED}
// Route       : POST /practice-labs/cookies/lab7/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab7Metadata: LabMetadata = {
  slug:          'cookies-lab7-predictable-session-id',
  title:         'I Know What You Did Last Session',
  ar_title:      'أعرف ما فعلته في الجلسة الأخيرة',
  description:
    'The server generates session IDs using a sequential counter. ' +
    'Observe the pattern, predict the admin session ID, and hijack their account.',
  ar_description:
    'يولّد الخادم معرّفات الجلسات باستخدام عدّاد تسلسلي. ' +
    'لاحظ النمط، توقّع معرّف جلسة المسؤول، واختطف حسابه.',

  difficulty:    'INTERMEDIATE',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Session ID Analysis',
    'Pattern Recognition',
    'Session Prediction',
    'Cryptographic Randomness',
  ],

  xpReward:     140,
  pointsReward: 140,
  duration:     25,
  isPublished:  true,

  goal:    'Analyze the session ID pattern, predict the admin session ID, and submit it to hijack the admin account.',
  ar_goal: 'حلّل نمط معرّف الجلسة، توقّع معرّف جلسة المسؤول، وأرسله لاختطاف حساب المسؤول.',

  flagAnswer: 'FLAG{PREDICTABLE_SESSION_ID_EXPLOITED}',

  briefing: {
    en: 'A web application generates session IDs using a simple sequential counter. ' +
        'You have an account. After logging in, you can observe your session ID. ' +
        'The admin logged in first, long before you. ' +
        'Can you predict what their session ID looks like?',
    ar: 'يولّد تطبيق ويب معرّفات الجلسات باستخدام عدّاد تسلسلي بسيط. ' +
        'لديك حساب. بعد تسجيل الدخول، يمكنك ملاحظة معرّف جلستك. ' +
        'سجّل المسؤول الدخول أولاً، قبلك بوقت طويل. ' +
        'هل يمكنك التنبؤ بمعرّف جلستهم؟',
  },

  stepsOverview: {
    en: [
      'Login with user@lab.com / password123 and note your session ID format',
      'Use the Observe panel to see multiple sequential session IDs',
      'Identify the pattern: sess_<role>_<incrementing_number>',
      'Determine what number the admin (first login, counter=1) would have',
      'Submit sess_admin_1 in the Predict panel',
      'Capture the flag',
    ],
    ar: [
      'سجّل دخولاً بـ user@lab.com / password123 ولاحظ تنسيق معرّف جلستك',
      'استخدم لوحة Observe لمشاهدة عدة معرّفات جلسات تسلسلية',
      'حدّد النمط: sess_<role>_<incrementing_number>',
      'حدّد الرقم الذي سيحمله المسؤول (أول تسجيل دخول، عدّاد=1)',
      'أرسل sess_admin_1 في لوحة Predict',
      'احصل على الفلاج',
    ],
  },

  solution: {
    context:
      'The server uses a shared global counter incremented on each login. ' +
      'Session IDs follow: sess_<role>_<counter>. ' +
      'Counter started at 0 and the admin was the first login, so their ID is sess_admin_1.',
    vulnerableCode:
      'let counter = 0;\n' +
      'function generateSessionId(role) {\n' +
      '  counter++;\n' +
      '  return `sess_${role}_${counter}`; // ❌ Predictable!\n' +
      '}',
    exploitation:
      'Login → observe sess_user_101 → note pattern → guess sess_admin_1 → submit → admin access.',
    steps: {
      en: [
        'POST /login → receive sess_user_<N>',
        'POST /observe → see sequential pattern',
        'Conclude: admin session = sess_admin_1',
        'POST /predict with predictedSessionId="sess_admin_1" → receive FLAG',
      ],
      ar: [
        'POST /login → استلام sess_user_<N>',
        'POST /observe → مشاهدة النمط التسلسلي',
        'استنتاج: جلسة المسؤول = sess_admin_1',
        'POST /predict مع predictedSessionId="sess_admin_1" → تلقي الفلاج',
      ],
    },
    fix: [
      'Use crypto.randomBytes(32).toString("hex") to generate session IDs.',
      'Never use sequential counters, timestamps, or any predictable source for session IDs.',
      'Ensure minimum 128 bits of entropy in every session ID.',
      'Use battle-tested session management libraries (express-session, etc.) with secure defaults.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Predictable session IDs allow attackers to enumerate or guess valid sessions. ' +
          'Even a small sample of observed IDs can reveal the entire generation pattern.',
      ar: 'تتيح معرّفات الجلسات القابلة للتنبؤ للمهاجمين تعداد الجلسات الصالحة أو تخمينها. ' +
          'حتى عيّنة صغيرة من المعرّفات المُلاحظة يمكن أن تكشف نمط التوليد بأكمله.',
    },
    impact: {
      en: 'Any active session on the server can be hijacked by predicting its ID — including privileged admin sessions.',
      ar: 'يمكن اختطاف أي جلسة نشطة على الخادم بالتنبؤ بمعرّفها — بما في ذلك جلسات المسؤول المميزة.',
    },
    fix: [
      'Use cryptographically secure random number generators exclusively.',
      'Session IDs must have at least 128 bits of unpredictable entropy.',
      'Regularly audit your session ID generation logic.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'After login, look at your session ID carefully. Does it follow any recognizable format?',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'Use the Observe panel to see multiple session IDs. What do the numbers at the end have in common?',
      xpCost: 15,
    },
    {
      order:   3,
      content: 'The admin logged in first (counter=1). Try predicting their session as: sess_admin_1',
      xpCost: 25,
    },
  ],
};
