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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Login as a regular employee, capture your JWT token, then call /auth/logout. Verify logout succeeded. Then reuse the old JWT token to access the /admin/dashboard endpoint — proving the server never invalidated it.',
  ar_goal:
    'سجّل الدخول كموظف عادي، التقط JWT token الخاص بك، ثم استدعِ /auth/logout. تحقق من نجاح تسجيل الخروج. ثم أعد استخدام JWT القديم للوصول إلى /admin/dashboard — مُثبتاً أن الخادم لم يُلغِه قط.',

  briefing: {
    en: `CorpSSO — enterprise Single Sign-On. One login for HR, Finance, CRM, DevOps.
You are employee_youssef. You log in.
JWT token: eyJhbGciOiJIUzI1NiJ9...
You use the app. You access your profile. Everything works.
Lunch break. You log out.
"Successfully logged out."
The cookie is cleared from your browser.
You leave your computer.
But the JWT?
The JWT was never told about the logout.
The server never wrote it to a denylist.
Never invalidated it.
Never checked for it.
Your attacker colleague saw the token.
They have it.
You logged out 10 minutes ago.
They send: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
/admin/dashboard.
200 OK.`,
    ar: `CorpSSO — تسجيل دخول موحَّد للمؤسسات. تسجيل دخول واحد لـ HR وFinance وCRM وDevOps.
أنت employee_youssef. تسجّل الدخول.
توكن JWT: eyJhbGciOiJIUzI1NiJ9...
تستخدم التطبيق. تصل لملفك الشخصي. كل شيء يعمل.
استراحة الغداء. تسجّل الخروج.
"تم تسجيل الخروج بنجاح."
يُمسح الكوكي من متصفحك.
تغادر الكمبيوتر.
لكن الـ JWT؟
لم يُخبَر الـ JWT قط بتسجيل الخروج.
الخادم لم يكتبه مطلقاً في denylist.
لم يُلغِه قط.
لم يتحقق منه قط.
زميلك المهاجم رأى التوكن.
لديهم إياه.
سجّلت الخروج منذ 10 دقائق.
يرسلون: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
/admin/dashboard.
200 OK.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/login { "email": "youssef@corp.io", "password": "youssef123" } → capture JWT token',
      'GET /employee/profile with JWT → 200 OK (confirm token works)',
      'POST /auth/logout → "Successfully logged out" — server clears cookie client-side',
      'GET /employee/profile WITHOUT token → 401 (confirm session appears ended)',
      'GET /admin/dashboard with OLD JWT in Authorization header → 200 OK (token never invalidated!)',
      'Flag returned in admin dashboard response',
    ],
    ar: [
      'POST /auth/login { "email": "youssef@corp.io"، "password": "youssef123" } → التقط JWT token',
      'GET /employee/profile مع JWT → 200 OK (أكّد أن التوكن يعمل)',
      'POST /auth/logout → "تم تسجيل الخروج بنجاح" — الخادم يمسح الكوكي من جانب العميل',
      'GET /employee/profile بدون توكن → 401 (أكّد أن الجلسة تبدو منتهية)',
      'GET /admin/dashboard مع JWT القديم في Authorization header → 200 OK (التوكن لم يُلغَ قط!)',
      'يُعاد العلم في استجابة لوحة تحكم المسؤول',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'CorpSSO logout only clears the client-side cookie. The JWT\'s validity is determined solely by its cryptographic signature and expiry — the server never checks a token denylist. Once issued, a JWT is valid until its "exp" claim passes. An attacker who captures a JWT (via XSS, network interception, or physical access) retains access for the entire token lifetime regardless of logout.',
    vulnerableCode:
      "// Logout endpoint (vulnerable):\napp.post('/auth/logout', isAuthenticated, async (req, res) => {\n" +
      '  // ❌ Only tells client to delete cookie — no server-side invalidation!\n' +
      '  // ❌ Token NOT added to denylist\n' +
      '  // ❌ Server-side session NOT destroyed\n' +
      "  res.clearCookie('ssoToken');\n" +
      "  res.json({ success: true, message: 'Logged out' });\n" +
      '});\n\n' +
      "// Protected route (vulnerable):\napp.get('/admin/dashboard', (req, res) => {\n" +
      "  // ❌ Only validates JWT signature — doesn't check denylist\n" +
      '  const payload = jwt.verify(req.headers.authorization, SECRET);\n' +
      '  res.json({ data: adminData });\n' +
      '});',
    exploitation:
      '1. POST /auth/login → save JWT\n' +
      '2. POST /auth/logout → 200 "Logged out"\n' +
      '3. GET /admin/dashboard with Authorization: Bearer <OLD_JWT> → 200 OK + flag\n' +
      'The server only checks jwt.verify() — it never checks if the token was explicitly invalidated.',
    steps: {
      en: [
        'POST /auth/login { "email": "youssef@corp.io", "password": "youssef123" } → { "token": "eyJhbGci..." } — SAVE THIS TOKEN',
        'GET /employee/profile → Authorization: Bearer eyJhbGci... → 200 OK (token active)',
        'POST /auth/logout → 200 { "success": true, "message": "Logged out" }',
        'GET /employee/profile → no token → 401 Unauthorized (confirms cookie cleared)',
        'GET /admin/dashboard → Authorization: Bearer eyJhbGci... (OLD TOKEN) → 200 OK → flag: FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
      ar: [
        'POST /auth/login { "email": "youssef@corp.io"، "password": "youssef123" } → { "token": "eyJhbGci..." } — احفظ هذا التوكن',
        'GET /employee/profile → Authorization: Bearer eyJhbGci... → 200 OK (التوكن نشط)',
        'POST /auth/logout → 200 { "success": true، "message": "Logged out" }',
        'GET /employee/profile → بدون توكن → 401 Unauthorized (يؤكد مسح الكوكي)',
        'GET /admin/dashboard → Authorization: Bearer eyJhbGci... (التوكن القديم) → 200 OK → العلم: FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
    },
    fix: [
      'Token denylist: on logout, add token JTI (JWT ID) to a Redis denylist with TTL = token expiry — check denylist on every authenticated request',
      'Short-lived tokens: issue JWTs with 15-minute expiry + refresh tokens — limits post-logout window even without denylist',
      'Stateful session reference: include a session ID in the JWT that is stored in DB — delete the session record on logout, check existence on every request',
      'Refresh token rotation: on logout, invalidate the refresh token in DB — even if access token is reused, it cannot be renewed',
    ],
  },

  postSolve: {
    explanation: {
      en: 'JWTs are stateless by design — they contain all authentication information within the token itself, verified by cryptographic signature. This is efficient but creates a fundamental tension with revocation: you cannot "un-sign" a JWT. The server must either maintain state (denylist, session reference) or accept that tokens remain valid until expiry. Most applications that "logout" JWTs without a denylist are simply lying to the user — the session isn\'t actually ended.',
      ar: 'JWTs لا تحتفظ بحالة بطبيعتها — تحتوي على جميع معلومات المصادقة داخل التوكن نفسه، متحقَّق منها بتوقيع تشفيري. هذا فعّال لكنه يخلق توتراً جوهرياً مع الإلغاء: لا يمكنك "إلغاء توقيع" JWT. يجب على الخادم إما الحفاظ على الحالة (denylist، مرجع جلسة) أو قبول أن التوكنات تظل صالحة حتى انتهاء الصلاحية. معظم التطبيقات التي "تسجّل الخروج" من JWTs بدون denylist تكذب ببساطة على المستخدم — الجلسة لم تنتهِ فعلياً.',
    },
    impact: {
      en: 'SSO token reuse: the attacker maintains access to ALL connected enterprise applications (HR, Finance, CRM, DevOps) even after the legitimate user has logged out, changed their password, or had their account disabled. The attack is especially dangerous in shared workstation environments or if the token was captured via XSS — there is no way for the user to revoke it.',
      ar: 'إعادة استخدام توكن SSO: يحتفظ المهاجم بالوصول إلى جميع تطبيقات المؤسسة المتصلة (HR، Finance، CRM، DevOps) حتى بعد تسجيل خروج المستخدم الشرعي أو تغيير كلمة مروره أو تعطيل حسابه. الهجوم خطير بشكل خاص في بيئات محطات العمل المشتركة أو إذا تم التقاط التوكن عبر XSS — لا توجد طريقة للمستخدم لإلغائه.',
    },
    fix: [
      'JWT denylist with Redis: on logout → SETEX jti <remaining_ttl_seconds> "revoked" → on every request → check if jti exists in Redis',
      'Short expiry (15 min) + refresh tokens: minimizes the post-logout attack window — even without denylist, old tokens expire quickly',
      'Opaque tokens option: use opaque session tokens (like a secure random string) stored in DB instead of JWTs — trivially revocable',
      'Force logout feature: allow users to invalidate ALL their active sessions (e.g., "log out everywhere") — requires server-side session tracking',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Login and save your complete JWT token. Then call /auth/logout. The server confirms logout. Now — does that mean the token is invalid on the server side too?',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Try accessing /employee/profile WITHOUT a token after logout — you get 401. But now try with your OLD token in the Authorization header: "Bearer <OLD_JWT>". What happens?',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'GET /admin/dashboard with your old JWT in the Authorization header. The server only validates the JWT signature — it never checks if the token was revoked. You should get 200.',
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
