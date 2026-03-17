// src/modules/practice-labs/broken-auth/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab4Metadata: LabMetadata = {
  slug: 'broken-auth-session-not-invalidated-logout-sso',
  canonicalConceptId: 'broken-auth-jwt-no-invalidation',
  environmentType: 'CORPORATE_SSO',
  title: 'Broken Auth: Session Not Invalidated — Corporate SSO Token Reuse After Logout',
  ar_title: 'Broken Auth: الجلسة لا تُلغى — إعادة استخدام توكن SSO بعد الخروج',
  description:
    'Exploit a broken authentication vulnerability in a corporate SSO platform where server-side session invalidation is missing on logout. Even after logout, the old JWT token remains valid and can be reused to access all connected services.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في منصة SSO حيث يغيب إلغاء الجلسة من جانب الخادم عند الخروج. حتى بعد الخروج، يظل توكن JWT القديم صالحاً ويمكن إعادة استخدامه.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['Broken Authentication', 'Session Management', 'JWT Reuse', 'Logout Flaw', 'SSO Security'],
  xpReward: 340,
  pointsReward: 170,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION GHOST SESSION',
    classification: 'SECRET',
    objective: {
      en: 'Capture a JWT from a legitimate CorpSSO session, log out, then reuse the same token to prove the server never invalidated it — gaining persistent access to all enterprise applications.',
      ar: 'التقط JWT من جلسة CorpSSO شرعية، سجّل الخروج، ثم أعد استخدام نفس التوكن لإثبات أن الخادم لم يُلغِه قط — تحقيق وصول دائم لجميع تطبيقات المؤسسة.',
    },
    successCriteria: {
      en: 'Access /admin/dashboard using the JWT captured BEFORE logout.',
      ar: 'صل إلى /admin/dashboard باستخدام JWT التُقط قبل تسجيل الخروج.',
    },
  },

  labInfo: {
    vulnType: 'Broken Authentication — Missing Server-Side Session Invalidation',
    cweId: 'CWE-613',
    cvssScore: 8.4,
    whatYouLearn: {
      en: [
        'Why JWT logout without a denylist is lying to the user',
        'How stateless JWTs create a fundamental revocation problem',
        'Token denylist pattern: JTI + Redis SETEX for proper invalidation',
        'Mitigation: short expiry + refresh token rotation + denylist',
      ],
      ar: [
        'لماذا تسجيل خروج JWT بدون denylist يكذب على المستخدم',
        'كيف تخلق JWTs عديمة الحالة مشكلة إلغاء جوهرية',
        'نمط token denylist: JTI + Redis SETEX للإلغاء الصحيح',
        'التخفيف: صلاحية قصيرة + تدوير refresh token + denylist',
      ],
    },
    techStack: ['REST API', 'Node.js', 'JWT', 'SSO', 'Redis'],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html',
      'https://owasp.org/www-community/attacks/Session_hijacking_attack',
      'https://cwe.mitre.org/data/definitions/613.html',
    ],
  },

  goal: 'Login as a regular employee, capture your JWT token, then call /auth/logout. Then reuse the old JWT to access /admin/dashboard — proving the server never invalidated it.',
  ar_goal:
    'سجّل الدخول كموظف عادي، التقط JWT token، ثم استدعِ /auth/logout. ثم أعد استخدام JWT القديم للوصول إلى /admin/dashboard.',

  briefing: {
    en: `CorpSSO — enterprise Single Sign-On. One login for HR, Finance, CRM, DevOps.
You are employee_youssef. You log in.
JWT: eyJhbGciOiJIUzI1NiJ9...
You log out. "Successfully logged out."
The cookie clears from your browser.
But the JWT?
Never told about the logout.
Never added to a denylist.
Your attacker colleague saved it.
You logged out 10 minutes ago.
They send: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
/admin/dashboard.
200 OK.`,
    ar: `CorpSSO — تسجيل دخول موحَّد للمؤسسات.
أنت employee_youssef. تسجّل الدخول.
تسجّل الخروج. "تم تسجيل الخروج بنجاح."
يُمسح الكوكي من متصفحك.
لكن الـ JWT?
لم يُخبَّر قط بتسجيل الخروج.
زميلك المهاجم حفظه.
يرسل: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
/admin/dashboard.
200 OK.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/login { "email": "youssef@corp.io", "password": "youssef123" } → SAVE JWT token',
      'GET /employee/profile with JWT → 200 OK (token active)',
      'POST /auth/logout → "Successfully logged out"',
      'GET /employee/profile without token → 401 (confirms cookie cleared)',
      'GET /admin/dashboard with OLD JWT → 200 OK (never invalidated) → flag',
    ],
    ar: [
      'POST /auth/login { "email": "youssef@corp.io"، "password": "youssef123" } → احفظ JWT',
      'GET /employee/profile مع JWT → 200 OK (التوكن نشط)',
      'POST /auth/logout → "تم تسجيل الخروج بنجاح"',
      'GET /employee/profile بدون توكن → 401 (يؤكد مسح الكوكي)',
      'GET /admin/dashboard مع JWT القديم → 200 OK (لم يُلغَ قط) → العلم',
    ],
  },

  solution: {
    context:
      'CorpSSO logout only clears the client-side cookie. JWT validity is determined solely by cryptographic signature and expiry. The server never checks a denylist. Once issued, a JWT is valid until its "exp" claim passes.',
    vulnerableCode:
      "app.post('/auth/logout', isAuthenticated, async (req, res) => {\n" +
      '  // ❌ Only clears cookie — no server-side invalidation!\n' +
      "  res.clearCookie('ssoToken');\n" +
      "  res.json({ success: true, message: 'Logged out' });\n" +
      '});\n\n' +
      "app.get('/admin/dashboard', (req, res) => {\n" +
      '  // ❌ Only validates signature — never checks denylist\n' +
      '  const payload = jwt.verify(req.headers.authorization, SECRET);\n' +
      '  res.json({ data: adminData });\n' +
      '});',
    exploitation:
      '1. Login → save JWT\n2. Logout → 200\n3. GET /admin/dashboard with old JWT → 200 + flag',
    steps: {
      en: [
        'POST /auth/login → save JWT token',
        'POST /auth/logout → 200 success',
        'GET /admin/dashboard with Authorization: Bearer <OLD_JWT> → FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
      ar: [
        'POST /auth/login → احفظ JWT',
        'POST /auth/logout → 200 نجاح',
        'GET /admin/dashboard مع Authorization: Bearer <OLD_JWT> → FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
    },
    fix: [
      'Token denylist: on logout, add JTI to Redis with TTL = token expiry — check on every request',
      'Short-lived tokens (15 min) + refresh tokens',
      'Stateful session reference: session ID in JWT stored in DB, delete on logout',
      'Force logout: allow invalidating ALL active sessions',
    ],
  },

  postSolve: {
    explanation: {
      en: 'JWTs are stateless by design — you cannot "un-sign" them. The server must maintain a denylist or accept tokens remain valid until expiry. Most JWT logout implementations are lying to the user.',
      ar: 'JWTs لا تحتفظ بحالة — لا يمكن إلغاء توقيعها. يجب على الخادم الحفاظ على denylist أو قبول بقاء التوكنات صالحة حتى انتهاء الصلاحية.',
    },
    impact: {
      en: 'SSO token reuse: access to ALL enterprise apps even after logout, password change, or account disable. Especially dangerous in shared workstation environments.',
      ar: 'إعادة استخدام SSO: وصول لجميع تطبيقات المؤسسة حتى بعد تسجيل الخروج أو تغيير كلمة المرور.',
    },
    fix: [
      'JWT denylist with Redis: SETEX jti <ttl> "revoked" on logout',
      'Short expiry (15 min) + refresh tokens',
      'Opaque session tokens as alternative to JWTs',
      'Force logout all sessions feature',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      ar_content: 'سجّل الدخول واحفظ JWT الكامل. ثم استدعِ /auth/logout. الخادم يؤكد تسجيل الخروج. هل يعني ذلك أن التوكن أصبح غير صالح من جانب الخادم أيضاً؟',
      content: 'Login and save your complete JWT token. Call /auth/logout. Does that mean the token is invalid server-side too?',
    },
    {
      order: 2,
      xpCost: 40,
      ar_content: 'جرّب الوصول إلى /employee/profile بدون توكن → 401. الآن جرّب مع JWT القديم في Authorization header. ماذا يحدث؟',
      content: 'Try /employee/profile without token → 401. Now try with OLD JWT in Authorization header. What happens?',
    },
    {
      order: 3,
      xpCost: 65,
      ar_content: 'GET /admin/dashboard مع JWT القديم في Authorization header. الخادم يتحقق فقط من التوقيع — لا يتحقق من الإلغاء. يجب أن تحصل على 200.',
      content: 'GET /admin/dashboard with old JWT in Authorization header. Server only validates JWT signature — never checks revocation. You should get 200.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
  initialState: {
    users: [
      { username: 'employee_youssef', password: 'youssef123', role: 'employee', email: 'youssef@corp.io' },
      { username: 'admin_corp', password: 'C0RP_ADM1N_2024!', role: 'admin', email: 'admin@corp.io' },
    ],
  },
};
