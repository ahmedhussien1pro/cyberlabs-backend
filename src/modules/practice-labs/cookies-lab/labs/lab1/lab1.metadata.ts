// src/modules/practice-labs/cookies-lab/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 1 — Cookie Role Manipulation (Plain Text)
// Credentials : user@lab.com / password123
// Cookie      : role=user  →  change to  role=admin
// Flag        : FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}
// Route       : POST /practice-labs/cookies/lab1/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab1Metadata: LabMetadata = {
  slug:          'cookies-lab1-role-manipulation',
  title:         'Admin Has the Power',
  ar_title:      'المسؤول لديه السلطة',
  description:
    'The application stores the current user role in a plain-text cookie with no integrity check. ' +
    'Login as a regular user, observe the role cookie, and escalate your privileges to admin.',
  ar_description:
    'يخزّن التطبيق دور المستخدم في كوكيز نصية بدون أي فحص سلامة. ' +
    'سجّل دخولاً كمستخدم عادي، لاحظ كوكيز الدور، وارفع صلاحياتك إلى مسؤول.',

  difficulty:    'BEGINNER',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Cookie Inspection',
    'Privilege Escalation',
    'Client-side Trust Exploitation',
    'Session Security',
  ],

  xpReward:     80,
  pointsReward: 80,
  duration:     15,
  isPublished:  true,

  goal:    'Login as user@lab.com, manipulate the role cookie from "user" to "admin", and access the admin panel.',
  ar_goal: 'سجّل دخولاً بـ user@lab.com، غيّر قيمة كوكيز الدور من "user" إلى "admin"، ثمّ ادخل لوحة التحكّم.',

  flagAnswer: 'FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}',

  briefing: {
    en: 'This app sets a cookie named "role" equal to "user" after login. ' +
        'The server trusts whatever value is sent back in that cookie — no signing, no server-side session. ' +
        'Can you figure out what value gives you admin access?',
    ar: 'يضبط هذا التطبيق كوكيز باسم "role" تساوي "مستخدم" بعد تسجيل الدخول. ' +
        'يثق الخادم بأيّ قيمة تُرسل في تلك الكوكيز دون توقيع أو جلسة من جانب الخادم. ' +
        'هل تستطيع معرفة القيمة التي تمنحك وصول المسؤول؟',
  },

  stepsOverview: {
    en: [
      'Login with user@lab.com / password123',
      'Observe the "role" cookie — its value is "user"',
      'Change the cookie value from "user" to "admin" in the Attack panel',
      'Submit the forged cookie to /admin',
      'Capture the flag',
    ],
    ar: [
      'سجّل دخولاً بـ user@lab.com / password123',
      'لاحظ كوكيز "role" — قيمتها هي "user"',
      'غيّر قيمة الكوكيز من "user" إلى "admin" في لوحة الهجوم',
      'أرسل الكوكيز المزيّفة إلى /admin',
      'احصل على الفلاج',
    ],
  },

  solution: {
    context:
      'The server sets cookie role=user after login and reads it back on every request. ' +
      'No HMAC, no server-side session — the value is taken at face value.',
    vulnerableCode:
      'const role = req.headers["x-session"]; // reads cookie directly\n' +
      'if (role !== "admin") return 403;',
    exploitation:
      'Login → receive role=user → change to role=admin → submit → admin access.',
    steps: {
      en: [
        'POST /login with user@lab.com / password123 → receive { cookie: { name:"role", value:"user" } }',
        'In the Attack panel, type "admin" into the forged cookie input',
        'POST /admin with header x-session: admin',
        'Server checks role === "admin" → true → returns FLAG',
      ],
      ar: [
        'POST /login بـ user@lab.com / password123 → تلقي { cookie: { name:"role", value:"user" } }',
        'في لوحة الهجوم، اكتب "admin" في حقل الكوكيز المزيّفة',
        'POST /admin مع header x-session: admin',
        'يتحقّق الخادم من role === "admin" → صحيح → يُرجع الفلاج',
      ],
    },
    fix: [
      'Never store authorization data (roles, permissions) in unsigned client-side cookies.',
      'Use server-side sessions (Redis / DB) where the cookie is only an opaque session ID.',
      'If you must use cookies, sign them with HMAC-SHA256 (cookie-parser secret or similar).',
      'Set HttpOnly + Secure + SameSite=Strict on all session cookies.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Plain-text cookies are freely editable by anyone with DevTools. ' +
          'Storing a role or permission directly in a cookie without signing means any user can become admin instantly.',
      ar: 'يمكن تحرير الكوكيز النصية بحرية تامة بواسطة أسلحة المطوّر. ' +
          'تخزين دور أو إذن مباشرةً في كوكيز دون توقيع يعني أن أي مستخدم يمكنه أن يصبح مسؤولاً فوراً.',
    },
    impact: {
      en: 'Full privilege escalation to admin. All admin-only endpoints become accessible.',
      ar: 'تصعيد كامل للصلاحيات إلى مسؤول. تصبح جميع نقاط النهاية الخاصة بالمسؤول متاحة.',
    },
    fix: [
      'Use HttpOnly + Secure + SameSite=Strict.',
      'Sign cookies with HMAC-SHA256 or use opaque session IDs.',
      'Store roles server-side — never trust client-provided authorization data.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'After login, open the Cookie Inspector panel on the left. What is the value of the "role" cookie?',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'The server checks the role cookie value on every request. What role would give you admin access?',
      xpCost: 15,
    },
    {
      order:   3,
      content: 'Type "admin" into the forged cookie field in the Attack panel and submit it to /admin.',
      xpCost: 25,
    },
  ],
};
