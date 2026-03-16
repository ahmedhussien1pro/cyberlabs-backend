import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'cookies-lab1-role-manipulation',
  title: 'Cookie Role Manipulation',
  ar_title: 'التلاعب بدور المستخدم عبر الكوكيز',
  description: 'Manipulate a client-side Base64 session cookie to escalate privileges from support to admin.',
  ar_description: 'تلاعب بكوكي الجلسة المرمَّزة بـ Base64 من جانب العميل للترقي من support إلى admin.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cookie Manipulation', 'Base64 Decoding', 'Privilege Escalation', 'Session Security'],
  xpReward: 80,
  pointsReward: 80,
  duration: 20,
  isPublished: true,
  goal: 'Login as support, manipulate the session cookie to escalate to admin.',
  ar_goal: 'سجّل دخولاً كـ support، ثم تلاعب بالكوكيز للترقي إلى admin.',
  flagAnswer: 'FLAG{COOKIES_ROLE_MANIPULATION_BASE64}',
  briefing: {
    en: 'The application stores the user role in a client-side cookie without any integrity check.',
    ar: 'يخزّن التطبيق دور المستخدم في كوكيز من جانب العميل دون أي فحص سلامة.',
  },
  stepsOverview: {
    en: [
      'Login with support@cyberlabs.tech / support123',
      'Decode the Base64 session cookie',
      'Change role from "support" to "admin"',
      'Re-encode with btoa() and send to /admin',
    ],
    ar: [
      'سجّل دخولاً بـ support@cyberlabs.tech / support123',
      'فك ترميز كوكيز الجلسة بـ Base64',
      'غيّر الدور من "support" إلى "admin"',
      'أعد الترميز بـ btoa() وأرسل إلى /admin',
    ],
  },
  solution: {
    context: 'Session cookie is Base64(JSON) with no HMAC. Server trusts cookie role field directly.',
    vulnerableCode: 'const session = JSON.parse(atob(req.cookies.session)); if (session.role === "admin")',
    exploitation: 'atob(cookie) → change role → btoa(modified) → send to /admin.',
    steps: {
      en: [
        'Login → get cookie: btoa(JSON)',
        'atob(cookie) → {email, role: "support"}',
        'Change to {email, role: "admin"} → btoa() → new cookie',
        'GET /admin with new cookie → FLAG captured',
      ],
      ar: [
        'تسجيل الدخول → الحصول على الكوكيز: btoa(JSON)',
        'atob(cookie) → {email, role: "support"}',
        'التغيير إلى {email, role: "admin"} → btoa() → كوكيز جديدة',
        'GET /admin بالكوكيز الجديدة → تم الحصول على الفلاج',
      ],
    },
    fix: [
      'Never store authorization data in unsigned cookies.',
      'Use server-side sessions or signed JWTs (HS256/RS256).',
      'Always verify integrity server-side — never trust client-provided roles.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'Client-side cookies without signatures can be freely modified. Any role, permission, or flag stored this way is attacker-controlled.',
      ar: 'يمكن تعديل كوكيز جانب العميل بدون توقيعات بحرية. أي دور أو إذن أو علم مخزَّن بهذه الطريقة يتحكم فيه المهاجم.',
    },
    impact: {
      en: 'Full privilege escalation. Attacker gains admin access to all protected endpoints.',
      ar: 'ترقٍّ كامل للامتيازات. يحصل المهاجم على وصول المدير لجميع نقاط النهاية المحمية.',
    },
    fix: ['Use HttpOnly + Secure + SameSite=Strict cookies.', 'Sign sessions with HMAC-SHA256 or use JWT.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'After login, check the session cookie. Try decoding it with atob().', xpCost: 10 },
    { order: 2, content: 'The cookie is JSON with a role field. Change it to "admin".', xpCost: 20 },
    { order: 3, content: 'Re-encode with btoa() and set it as your session cookie before accessing /admin.', xpCost: 30 },
  ],
};
