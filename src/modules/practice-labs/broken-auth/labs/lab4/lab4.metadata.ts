// src/modules/practice-labs/broken-auth/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab4Metadata: LabMetadata = {
  slug: 'broken-auth-session-not-invalidated-logout-sso',
  title:
    'Broken Auth: Session Not Invalidated — Corporate SSO Token Reuse After Logout',
  ar_title: 'Broken Auth: الجلسة لا تُلغى — إعادة استخدام توكن SSO بعد الخروج',
  description:
    'Exploit a broken authentication vulnerability in a corporate SSO platform where server-side session invalidation is missing on logout. Even after the user logs out, the old JWT token remains valid and can be reused to regain full authenticated access to all connected services.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في منصة SSO حيث يغيب إلغاء الجلسة من جانب الخادم عند الخروج. حتى بعد خروج المستخدم، يظل توكن JWT القديم صالحاً ويمكن إعادة استخدامه للوصول إلى جميع الخدمات المتصلة.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Session Management',
    'JWT Reuse',
    'Logout Flaw',
    'SSO Security',
  ],
  xpReward: 340,
  pointsReward: 170,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Login as a regular employee, capture your JWT token, then call /auth/logout. Verify logout succeeded. Then reuse the old JWT token to access the /admin/dashboard endpoint — proving the server never invalidated it.',
  scenario: {
    context:
      'CorpSSO is a Single Sign-On platform for enterprise applications. On logout, the frontend clears the cookie — but the backend does NOT add the token to a denylist or invalidate the server-side session. An attacker who captured a valid JWT (via XSS, network sniffing, or shoulder surfing) can continue using it indefinitely even after the legitimate user has logged out.',
    vulnerableCode: `// Logout endpoint (vulnerable):
app.post('/auth/logout', isAuthenticated, async (req, res) => {
  // ❌ Only tells client to delete cookie — no server-side invalidation!
  // ❌ Token NOT added to denylist
  // ❌ Server-side session NOT destroyed
  res.clearCookie('ssoToken');
  res.json({ success: true, message: 'Logged out' });
});

// Protected route (vulnerable):
app.get('/admin/dashboard', (req, res) => {
  // ❌ Only validates JWT signature — doesn't check denylist
  const payload = jwt.verify(req.headers.authorization, SECRET);
  res.json({ data: adminData });
});`,
    exploitation:
      '1. Login → capture JWT token. 2. Call /auth/logout (server confirms logout). 3. Reuse the captured token in Authorization header. 4. Server accepts it — full access remains.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Login and save your JWT token. Then call /auth/logout. The server says "logged out" successfully.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Try accessing /employee/profile WITHOUT a token after logout — you get 401. But what if you use your OLD token?',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /admin/dashboard with your old JWT in the Authorization header: "Bearer <OLD_TOKEN>". Does the server reject it?',
    },
    {
      order: 4,
      xpCost: 95,
      content:
        'The server only validates JWT signature — it never checks if the token was logged out. Your old token still works. Access /admin/dashboard to get the flag.',
    },
  ],
  flagAnswer: 'FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
  initialState: {
    users: [
      {
        username: 'employee_youssef',
        password: 'youssef123',
        role: 'employee',
        email: 'youssef@corp.io',
      },
      {
        username: 'admin_corp',
        password: 'C0RP_ADM1N_2024!',
        role: 'admin',
        email: 'admin@corp.io',
      },
    ],
  },
};
