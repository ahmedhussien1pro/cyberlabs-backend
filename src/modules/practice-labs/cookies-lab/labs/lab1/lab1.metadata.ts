import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'cookies-lab1-role-manipulation',
  title: 'Cookie Role Manipulation',
  ar_title: 'التلاعب بـ Role في الكوكيز',
  description: 'Login as a support user, manipulate the Base64-encoded session cookie to escalate to admin.',
  ar_description: 'سجّل دخول كـ support، عدّل الـ session cookie المشفرة بـ Base64 للوصول كـ admin.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cookie Manipulation', 'Base64', 'Privilege Escalation', 'Session Security'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Modify the session cookie to change your role from "support" to "admin" and access the admin panel.',
  ar_goal: 'عدّل الـ session cookie لتغيير الـ role من "support" إلى "admin" والوصول للوحة الإدارة.',
  flagAnswer: 'FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}',
  briefing: {
    story: 'The application stores the user role in a client-side cookie without any integrity check.',
    objective: 'Login, decode the cookie, change the role, re-encode, and access the admin panel.',
  },
  stepsOverview: [
    { step: 1, title: 'Login', description: 'POST /login with support credentials' },
    { step: 2, title: 'Decode cookie', description: 'Base64-decode the session cookie value' },
    { step: 3, title: 'Modify role', description: 'Change role from "support" to "admin"' },
    { step: 4, title: 'Re-encode', description: 'Base64-encode the modified JSON' },
    { step: 5, title: 'Admin access', description: 'Send new cookie to /admin and get the flag' },
  ],
  solution: {
    summary: 'Decode Base64 → change role → re-encode → send as x-session header.',
    steps: [
      'Login: email=support@cyberlabs.tech, password=support123',
      'atob(cookie) → {email, role:"support"}',
      'Change role to "admin"',
      'btoa(JSON.stringify(modified)) → new cookie',
      'POST /admin with x-session: new_cookie',
    ],
  },
  postSolve: {
    lesson: 'Never store authorization data in unsigned cookies. Use server-side sessions or signed JWTs.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'The cookie value is Base64-encoded JSON. Decode it to see the role.', xpCost: 5 },
    { order: 2, content: 'Modify the role field in the JSON object to "admin".', xpCost: 10 },
    { order: 3, content: 'Re-encode with btoa() and send as the x-session header to /admin.', xpCost: 15 },
  ],
};
