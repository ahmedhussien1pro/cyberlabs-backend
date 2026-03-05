// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab5Metadata: LabMetadata = {
  slug: 'acvuln-http-method-override-admin',
  title: 'HTTP Method Tampering: Hidden Admin Delete Function',
  ar_title: 'التلاعب بطريقة HTTP: وظيفة الحذف الإدارية المخفية',
  description:
    'Exploit an access control vulnerability by using HTTP method override headers to bypass role-based restrictions and execute an admin-only DELETE operation on user accounts.',
  ar_description:
    'استغل ثغرة التحكم بالوصول باستخدام headers تجاوز طريقة HTTP لتجاوز القيود القائمة على الأدوار وتنفيذ عملية DELETE إدارية على حسابات المستخدمين.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'HTTP Method Override',
    'Hidden Admin Functions',
    'REST API Security',
    'Authorization Bypass',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Delete the "carlos" user account (normally restricted to admin role) by exploiting HTTP method override to convert a GET request into a DELETE request that bypasses authorization checks.',
  scenario: {
    context:
      'You are logged into UserHub SaaS as a regular user. The platform has a user management API: GET /api/users/:username returns user details (public), DELETE /api/users/:username deletes the user (admin only). The backend checks authorization ONLY on explicit DELETE requests. However, it supports X-HTTP-Method-Override header for legacy clients, allowing GET requests to be treated as DELETE.',
    vulnerableCode: `// Backend route handler:
app.delete('/users/:username', requireAdmin, deleteUser);
app.get('/users/:username', getUser);

// Middleware processes method override BEFORE routing:
if (req.headers['x-http-method-override']) {
  req.method = req.headers['x-http-method-override'];
}
// ❌ Now GET becomes DELETE, bypassing requireAdmin middleware`,
    exploitation:
      'Send a GET request to /users/carlos but include the header X-HTTP-Method-Override: DELETE. The backend will process it as DELETE /users/carlos, but the authorization middleware that checks for admin role runs AFTER the method override, so it sees the original GET and allows it through.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Try DELETE /users/carlos as a regular user. You get 403 Forbidden: "Admin role required." The DELETE method is properly protected.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Now try GET /users/carlos. It works — you see user details. This endpoint is public. But what if you could make the server treat this GET as DELETE?',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'Research HTTP method override. Some APIs support headers like X-HTTP-Method-Override or X-Method-Override to tunnel other HTTP methods through GET/POST (for legacy firewall compatibility).',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'Full exploit: Send GET /users/carlos with header X-HTTP-Method-Override: DELETE. The server will process it as a DELETE request, but authorization checks may not apply correctly. Check the response for success and flag.',
    },
  ],

  flagAnswer: 'FLAG{HTTP_METHOD_OVERRIDE_ADMIN_DELETE_PWN}',
  initialState: {
    users: [
      { username: 'wiener', password: 'peter', role: 'user' },
      { username: 'carlos', password: 'montoya', role: 'user' },
      {
        username: 'administrator',
        password: 'ADM1N_ROOT_2026!',
        role: 'admin',
      },
    ],
    logs: [
      {
        action: 'USER_LOGIN',
        meta: {
          username: 'carlos',
          timestamp: '2026-03-04T08:00:00Z',
          ip: '10.0.1.50',
        },
      },
    ],
  },
};
