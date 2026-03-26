// src/modules/practice-labs/cookies-lab/labs/lab6/lab6.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 6 — Insecure Cookie Flags
// Credentials : user@lab.com / password123
// Missing flags: Secure, HttpOnly, SameSite
// Flag         : FLAG{INSECURE_COOKIE_FLAGS_IDENTIFIED_AND_FIXED}
// Route        : POST /practice-labs/cookies/lab6/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab6Metadata: LabMetadata = {
  slug:          'cookies-lab6-insecure-cookie-flags',
  title:         'Naked Session',
  ar_title:      'الجلسة المكشوفة',
  description:
    'A session cookie is configured without the Secure, HttpOnly, and SameSite flags. ' +
    'Identify all missing security attributes and apply the correct configuration.',
  ar_description:
    'تم تكوين كوكيز الجلسة بدون علامات Secure وHttpOnly وSameSite. ' +
    'حدّد جميع سمات الأمان المفقودة وطبّق التكوين الصحيح.',

  difficulty:    'BEGINNER',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'Cookie Security Flags',
    'Secure Attribute',
    'HttpOnly Attribute',
    'SameSite Attribute',
    'Security Hardening',
  ],

  xpReward:     90,
  pointsReward: 90,
  duration:     15,
  isPublished:  true,

  goal:    'Identify the three missing cookie security flags and apply the correct secure configuration.',
  ar_goal: 'حدّد علامات أمان الكوكيز الثلاث المفقودة وطبّق التكوين الآمن الصحيح.',

  flagAnswer: 'FLAG{INSECURE_COOKIE_FLAGS_IDENTIFIED_AND_FIXED}',

  briefing: {
    en: 'After login, inspect the session cookie returned by the server. ' +
        'Notice that critical security flags are missing or misconfigured. ' +
        'Your task: identify them all and then apply the correct fix.',
    ar: 'بعد تسجيل الدخول، افحص كوكيز الجلسة التي يُعيدها الخادم. ' +
        'لاحظ أن علامات الأمان الحيوية مفقودة أو مهيأة بشكل خاطئ. ' +
        'مهمتك: تحديدها جميعاً ثم تطبيق الإصلاح الصحيح.',
  },

  stepsOverview: {
    en: [
      'Login with user@lab.com / password123',
      'Inspect the returned cookie object — note the Secure, HttpOnly, and SameSite values',
      'Submit the list of missing/incorrect flags in the Audit panel',
      'Apply the correct values in the Fix panel: Secure=true, HttpOnly=true, SameSite=Strict',
      'Capture the flag',
    ],
    ar: [
      'سجّل دخولاً بـ user@lab.com / password123',
      'افحص كائن الكوكيز المُعاد — لاحظ قيم Secure وHttpOnly وSameSite',
      'أرسل قائمة العلامات المفقودة/الخاطئة في لوحة Audit',
      'طبّق القيم الصحيحة في لوحة Fix: Secure=true، HttpOnly=true، SameSite=Strict',
      'احصل على الفلاج',
    ],
  },

  solution: {
    context:
      'The cookie is set without Secure (allows HTTP transmission), ' +
      'HttpOnly (allows JS access), and with SameSite=None (allows cross-site sending). ' +
      'Each missing flag enables a different attack vector.',
    vulnerableCode:
      'res.cookie("session_id", value, {\n' +
      '  secure: false,    // ❌ Allows HTTP\n' +
      '  httpOnly: false,  // ❌ JS accessible\n' +
      '  sameSite: "None" // ❌ Cross-site allowed\n' +
      '});',
    exploitation:
      'Secure missing → network sniffing on HTTP. ' +
      'HttpOnly missing → XSS cookie theft. ' +
      'SameSite=None → CSRF attacks.',
    steps: {
      en: [
        'POST /login → inspect cookie: secure=false, httpOnly=false, sameSite=None',
        'POST /audit with missingFlags: ["Secure", "HttpOnly", "SameSite"]',
        'POST /fix with secure:true, httpOnly:true, sameSite:"Strict"',
        'Receive FLAG',
      ],
      ar: [
        'POST /login → فحص الكوكيز: secure=false، httpOnly=false، sameSite=None',
        'POST /audit مع missingFlags: ["Secure", "HttpOnly", "SameSite"]',
        'POST /fix مع secure:true، httpOnly:true، sameSite:"Strict"',
        'تلقي الفلاج',
      ],
    },
    fix: [
      'Set Secure=true: cookie only sent over HTTPS, prevents network interception.',
      'Set HttpOnly=true: JavaScript cannot read cookie, prevents XSS-based theft.',
      'Set SameSite=Strict: cookie not sent with cross-site requests, prevents CSRF.',
      'Also consider adding Max-Age or Expires for proper session lifetime management.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Each cookie flag addresses a specific attack vector. ' +
          'All three should always be set on session cookies in production applications.',
      ar: 'تعالج كل علامة كوكيز متجهَ هجوم محدداً. ' +
          'يجب دائماً تعيين الثلاثة على كوكيز الجلسة في تطبيقات الإنتاج.',
    },
    impact: {
      en: 'Missing flags enable network sniffing, XSS cookie theft, and CSRF attacks simultaneously.',
      ar: 'تتيح العلامات المفقودة التنصت على الشبكة وسرقة كوكيز XSS وهجمات CSRF في آنٍ واحد.',
    },
    fix: [
      'Secure=true, HttpOnly=true, SameSite=Strict on ALL session cookies.',
      'Add these defaults to your framework session middleware configuration.',
      'Run a cookie audit regularly to verify flags on all sensitive cookies.',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'Look at the cookie object returned after login. How many security flags can you see? Are any set to false?',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'The three critical security flags for any session cookie are: Secure, HttpOnly, and SameSite.',
      xpCost: 15,
    },
    {
      order:   3,
      content: 'Submit ["Secure","HttpOnly","SameSite"] to /audit, then fix with secure:true, httpOnly:true, sameSite:"Strict".',
      xpCost: 25,
    },
  ],
};
