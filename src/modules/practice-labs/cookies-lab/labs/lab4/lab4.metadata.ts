// src/modules/practice-labs/cookies-lab/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 4 — XSS Cookie Theft (Missing HttpOnly)
// Credentials : user@lab.com / password123  |  admin@lab.com / adminpass
// Admin session: sess_admin_9f3k2m8x
// Flag        : FLAG{XSS_COOKIE_THEFT_HTTPONLY_MISSING}
// Route       : POST /practice-labs/cookies/lab4/*
// ─────────────────────────────────────────────────────────────────────────────
export const lab4Metadata: LabMetadata = {
  slug:          'cookies-lab4-xss-cookie-theft',
  title:         'Invisible Heist',
  ar_title:      'السطو الخفي',
  description:
    'The session cookie is missing the HttpOnly flag. ' +
    'Inject an XSS payload into the comment box to steal the admin session cookie and hijack the account.',
  ar_description:
    'تفتقر كوكيز الجلسة إلى علامة HttpOnly. ' +
    'أدخل حمولة XSS في خانة التعليقات لسرقة كوكيز جلسة المسؤول والاستيلاء على الحساب.',

  difficulty:    'INTERMEDIATE',
  category:      'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',

  skills: [
    'XSS Exploitation',
    'Cookie Theft',
    'Session Hijacking',
    'HttpOnly Flag',
  ],

  xpReward:     120,
  pointsReward: 120,
  duration:     20,
  isPublished:  true,

  goal:    'Use an XSS payload in the comment field to steal the admin session cookie, then submit it to hijack the session.',
  ar_goal: 'استخدم حمولة XSS في حقل التعليقات لسرقة كوكيز جلسة المسؤول، ثم أرسلها لاختطاف الجلسة.',

  flagAnswer: 'FLAG{XSS_COOKIE_THEFT_HTTPONLY_MISSING}',

  briefing: {
    en: 'A blog app lets users post comments without sanitising the input. ' +
        'The session cookies have no HttpOnly flag. ' +
        'If you can run JavaScript in the victim browser, you can steal the session.',
    ar: 'تطبيق مدونة يسمح للمستخدمين بنشر التعليقات دون تنقية المدخلات. ' +
        'كوكيز الجلسة لا تحمل علامة HttpOnly. ' +
        'إذا استطعت تشغيل JavaScript في متصفح الضحية يمكنك سرقة الجلسة.',
  },

  stepsOverview: {
    en: [
      'Login as user@lab.com / password123 and observe the session cookie',
      'Notice the cookie has NO HttpOnly flag — JavaScript can read it',
      'Post a comment containing: <script>fetch("/steal?c="+document.cookie)</script>',
      'The server simulates the victim browser executing your payload',
      'Receive the admin stolen cookie from the simulation',
      'Submit the stolen cookie to gain admin access and capture the flag',
    ],
    ar: [
      'سجّل دخولاً بـ user@lab.com / password123 ولاحظ كوكيز الجلسة',
      'لاحظ أن الكوكيز لا تحمل علامة HttpOnly — يمكن لـ JavaScript قراءتها',
      'انشر تعليقاً يحتوي على: <script>fetch("/steal?c="+document.cookie)</script>',
      'يحاكي الخادم تنفيذ المتصفح لحمولتك',
      'تلقّ كوكيز المسؤول المسروقة من المحاكاة',
      'أرسل الكوكيز المسروقة للحصول على وصول المسؤول والحصول على الفلاج',
    ],
  },

  solution: {
    context:
      'Session cookies lack HttpOnly. The comment box reflects input without sanitisation. ' +
      'Combining these two flaws enables XSS-based session hijacking.',
    vulnerableCode:
      'res.cookie("session_id", sessionValue); // no httpOnly: true\n' +
      'res.json({ comment: req.body.comment }); // no sanitisation',
    exploitation:
      'Inject XSS → victim browser executes script → script reads document.cookie → ' +
      'cookie sent to attacker → attacker uses it to impersonate victim.',
    steps: {
      en: [
        'POST /login → receive session_id cookie (no HttpOnly)',
        'POST /comment with payload containing document.cookie reference',
        'Server returns simulated stolen admin session cookie',
        'POST /steal with stolenCookie value → receive FLAG',
      ],
      ar: [
        'POST /login → تلقي كوكيز session_id (بدون HttpOnly)',
        'POST /comment مع حمولة تحتوي على مرجع document.cookie',
        'يُعيد الخادم كوكيز جلسة المسؤول المحاكاة المسروقة',
        'POST /steal مع قيمة stolenCookie → تلقي الفلاج',
      ],
    },
    fix: [
      'Always set HttpOnly=true on session cookies: res.cookie("session_id", val, { httpOnly: true })',
      'Sanitise all user input before rendering — use a library like DOMPurify on the frontend.',
      'Implement Content Security Policy (CSP) headers to prevent inline script execution.',
      'Use Secure + SameSite=Strict alongside HttpOnly for complete cookie protection.',
    ],
  },

  postSolve: {
    explanation: {
      en: 'The HttpOnly flag prevents JavaScript from accessing cookies via document.cookie. ' +
          'Without it, any XSS vulnerability instantly becomes a session hijacking vulnerability.',
      ar: 'تمنع علامة HttpOnly JavaScript من الوصول إلى الكوكيز عبر document.cookie. ' +
          'بدونها، أي ثغرة XSS تصبح فوراً ثغرة اختطاف جلسة.',
    },
    impact: {
      en: 'Full account takeover. Attacker gains all privileges of the victim without knowing their password.',
      ar: 'استيلاء كامل على الحساب. يحصل المهاجم على جميع صلاحيات الضحية دون معرفة كلمة مروره.',
    },
    fix: [
      'Set HttpOnly=true on ALL session cookies.',
      'Sanitise user input to prevent XSS injection.',
      'Add CSP headers: Content-Security-Policy: script-src \'self\'',
    ],
  },

  initialState: {},

  hints: [
    {
      order:   1,
      content: 'Look at the cookie inspector after login. Is the HttpOnly flag set? What does that mean for JavaScript?',
      xpCost: 5,
    },
    {
      order:   2,
      content: 'Try posting a comment that contains JavaScript referencing document.cookie.',
      xpCost: 15,
    },
    {
      order:   3,
      content: 'Use a payload like: <script>fetch("/steal?c="+document.cookie)</script> in the comment box.',
      xpCost: 25,
    },
  ],
};
