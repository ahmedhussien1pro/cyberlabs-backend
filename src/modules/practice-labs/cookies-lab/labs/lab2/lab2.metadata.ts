// src/modules/practice-labs/cookies-lab/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 2 — Base64 UserId Cookie Bypass
// Credentials : user@lab.com / password123
// Cookie      : userId=OQ== (base64 of "9")  →  change to  userId=MQ== (base64 of "1")
// Flag        : FLAG{BASE64_IS_NOT_ENCRYPTION}
// Route       : POST /practice-labs/cookies/lab2/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab2Metadata: LabMetadata = {
  slug:          'cookies-lab2-base64-userid',
  title:         'Hashing',
  ar_title:      'التجزئة',
  description:
    'The application encodes the userId in Base64 and stores it in a cookie — without any signing. ' +
    'Decode the cookie, figure out the admin\'s ID, re-encode it, and gain admin access.',
  ar_description:
    'يستخدم التطبيق ترميز Base64 لتخزين معرّف المستخدم في كوكيز — دون أي توقيع. ' +
    'فكّ ترميز الكوكيز، اكتشف معرّف المسؤول، أعد ترميزه، واحصل على وصول المسؤول.',

  difficulty:    'BEGINNER',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Base64 Encoding/Decoding',
    'Cookie Manipulation',
    'Privilege Escalation',
    'Insecure Deserialization Basics',
    'Session Security',
  ],

  xpReward:     90,
  pointsReward: 90,
  duration:     20,
  isPublished:  true,

  goal:    'Login as user@lab.com, decode the userId cookie, change the ID to 1 (admin), re-encode in Base64, and submit.',
  ar_goal: 'سجّل دخولاً بـ user@lab.com، فكّ ترميز كوكيز userId، غيّر المعرّف إلى 1 (مسؤول)، أعد ترميزه بـ Base64، وأرسله.',

  flagAnswer: 'FLAG{BASE64_IS_NOT_ENCRYPTION}',

  briefing: {
    en: 'After login you receive a cookie: userId=OQ==. ' +
        'It looks like gibberish — but it is just Base64. ' +
        'Decode it, understand what it means, and think: what ID would the admin have?',
    ar: 'بعد تسجيل الدخول تتلقى كوكيز: userId=OQ==. ' +
        'يبدو كأنها طلاسم رموز — لكنها مجرد Base64. ' +
        'فكّ ترميزها، افهم ما تعني، وفكّر: ما هو المعرّف الذي سيكون للمسؤول؟',
  },

  stepsOverview: {
    en: [
      'Login with user@lab.com / password123',
      'Observe the userId cookie — value is "OQ=="',
      'Decode: atob("OQ==") = "9" — that is your user ID',
      'Encode admin ID: btoa("1") = "MQ=="',
      'Submit the forged cookie (MQ==) to /admin',
      'Capture the flag',
    ],
    ar: [
      'سجّل دخولاً بـ user@lab.com / password123',
      'لاحظ كوكيز userId — القيمة هي "OQ=="',
      'فكّ الترميز: atob("OQ==") = "9" — هذا هو معرّفك',
      'رمّز معرّف المسؤول: btoa("1") = "MQ=="',
      'أرسل الكوكيز المزيّفة (MQ==) إلى /admin',
      'احصل على الفلاج',
    ],
  },

  solution: {
    context:
      'The server Base64-encodes the userId and sets it as a cookie. ' +
      'On /admin it decodes the cookie and checks if the numeric value equals 1 (admin). ' +
      'No HMAC, no session table — Base64 is trivially reversible.',
    vulnerableCode:
      'const decoded = Buffer.from(req.headers["x-session"], "base64").toString();\n' +
      'if (decoded === "1") grantAdmin();',
    exploitation:
      'atob("OQ==") = "9" (your ID) → btoa("1") = "MQ==" (admin ID) → submit MQ== → flag.',
    steps: {
      en: [
        'POST /login → receive cookie: { name:"userId", value:"OQ==", decoded:"9" }',
        'Use the Base64 Reference tab: atob("OQ==") = "9" (support account)',
        'Admin always has ID = 1. Encode: btoa("1") = "MQ=="',
        'POST /admin with header x-session: MQ==',
        'Server decodes "MQ==" → "1" → grants admin → returns FLAG',
      ],
      ar: [
        'POST /login → تلقي كوكيز: { name:"userId", value:"OQ==", decoded:"9" }',
        'استخدم تبويب Base64 Reference: atob("OQ==") = "9" (حساب support)',
        'معرّف المسؤول دائماً = 1. رمّز: btoa("1") = "MQ=="',
        'POST /admin مع header x-session: MQ==',
        'يفكّ الخادم "MQ==" → "1" → يمنح صلاحيات مسؤول → يُرجع الفلاج',
      ],
    },
    fix: [
      'Never use Base64 as a security mechanism — it is encoding, not encryption.',
      'Sign the cookie with HMAC-SHA256 so any tampering is detectable.',
      'Use opaque session IDs backed by a server-side session store (Redis / DB).',
      'Set HttpOnly + Secure + SameSite=Strict on session cookies.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Base64 is a reversible encoding algorithm. It provides zero confidentiality or integrity. ' +
          'Developers sometimes mistake it for obfuscation, but any attacker with atob() can decode it in seconds. ' +
          'Storing a user ID in an unsigned cookie allows any user to impersonate any other user.',
      ar: 'Base64 خوارزمية ترميز عكسية. لا توفر أي سرية أو سلامة. ' +
          'يخلط المطوّرون أحياناً بينها وبين التشفير، لكن أي مهاجم باستخدام atob() يمكنه فكّ ترميزها خلال ثوانٍ.',
    },
    impact: {
      en: 'Full user impersonation. Any user can become any other user (including admin) by guessing or brute-forcing small numeric IDs.',
      ar: 'انتحال هوية كامل. يمكن لأي مستخدم أن يصبح أي مستخدم آخر (بما في ذلك المسؤول) عن طريق تخمين المعرّفات الرقمية الصغيرة.',
    },
    fix: [
      'Base64 ≠ encryption. Never use it as a security layer.',
      'Use HMAC-signed cookies or server-side session IDs.',
      'Use UUIDs instead of sequential integers for user IDs.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'The userId cookie value looks odd — it ends with "==". That is a Base64 padding character. Try decoding it with atob() in the browser console.',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'You decoded your ID (it is 9). Admins usually have the lowest ID in a system. What is the most common admin ID? Encode it with btoa().',
      xpCost: 20,
    },
    {
      order:   3,
      content: 'Admin ID = 1. btoa("1") = "MQ==". Paste "MQ==" into the forged cookie field and submit it to /admin.',
      xpCost: 35,
    },
  ],
};
