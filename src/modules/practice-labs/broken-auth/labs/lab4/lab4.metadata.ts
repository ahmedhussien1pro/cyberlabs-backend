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
    'استغل ثغرة مصادقة مكسورة في منصة SSO حيث يغيب إلغاء الجلسة عند الخروج. حتى بعد الخروج، يظل JWT صالحاً.',
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
    objective: 'Capture a JWT from a legitimate CorpSSO session, log out, then reuse the same token to prove the server never invalidated it.',
    ar_objective: 'التقط JWT من جلسة CorpSSO شرعية، سجّل الخروج، ثم أعد استخدام نفس التوكن لإثبات أن الخادم لم يُلغِه قط.',
    successCriteria: ['Access /admin/dashboard using the JWT captured BEFORE logout'],
    ar_successCriteria: ['صل إلى /admin/dashboard باستخدام JWT التُقط قبل تسجيل الخروج'],
  },

  labInfo: {
    vulnType: 'Broken Authentication — Missing Server-Side Session Invalidation',
    ar_vulnType: 'Broken Authentication — غياب إلغاء الجلسة من جانب الخادم',
    cweId: 'CWE-613',
    cvssScore: 8.4,
    description: 'JWT logout only clears the client cookie. The server never adds the token to a denylist, so the JWT remains valid until its exp claim passes.',
    ar_description: 'تسجيل خروج JWT يمسح الكوكي فقط. الخادم لا يضيف التوكن لـ denylist، فيظل صالحاً.',
    whatYouLearn: [
      'Why JWT logout without a denylist is lying to the user',
      'How stateless JWTs create a fundamental revocation problem',
      'Token denylist pattern: JTI + Redis SETEX for proper invalidation',
      'Mitigation: short expiry + refresh token rotation + denylist',
    ],
    ar_whatYouLearn: [
      'لماذا تسجيل خروج JWT بدون denylist يكذب على المستخدم',
      'كيف تخلق JWTs عديمة الحالة مشكلة إلغاء جوهرية',
      'نمط token denylist: JTI + Redis SETEX',
      'التخفيف: صلاحية قصيرة + تدوير refresh token + denylist',
    ],
    techStack: ['REST API', 'Node.js', 'JWT', 'SSO', 'Redis'],
    references: [
      { label: 'JWT Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html' },
      { label: 'Session Hijacking Attack', url: 'https://owasp.org/www-community/attacks/Session_hijacking_attack' },
      { label: 'CWE-613', url: 'https://cwe.mitre.org/data/definitions/613.html' },
    ],
  },

  goal: 'Login as a regular employee, capture your JWT token, then call /auth/logout. Then reuse the old JWT to access /admin/dashboard — proving the server never invalidated it.',
  ar_goal: 'سجّل الدخول كموظف عادي، التقط JWT، ثم استدعِ /auth/logout. ثم أعد استخدام JWT القديم للوصول إلى /admin/dashboard.',

  briefing: {
    en: 'CorpSSO logout only clears client cookie. JWT never added to denylist. Colleague saved your token. After logout: Authorization: Bearer <OLD_JWT> → /admin/dashboard → 200 OK.',
    ar: 'تسجيل خروج CorpSSO يمسح الكوكي فقط. JWT لم يُضاف لـ denylist. بعد الخروج: Authorization: Bearer <OLD_JWT> → /admin/dashboard → 200 OK.',
  },

  stepsOverview: {
    en: [
      'POST /auth/login → SAVE JWT token',
      'GET /employee/profile with JWT → 200 OK',
      'POST /auth/logout → success',
      'GET /employee/profile without token → 401',
      'GET /admin/dashboard with OLD JWT → 200 OK → flag',
    ],
    ar: [
      'POST /auth/login → احفظ JWT',
      'GET /employee/profile مع JWT → 200 OK',
      'POST /auth/logout → نجاح',
      'GET /employee/profile بدون توكن → 401',
      'GET /admin/dashboard مع JWT القديم → 200 OK → العلم',
    ],
  },

  solution: {
    context: 'CorpSSO logout only clears client-side cookie. JWT validity determined solely by cryptographic signature and expiry. Server never checks denylist.',
    vulnerableCode:
      "app.post('/auth/logout', isAuthenticated, async (req, res) => {\n" +
      '  // \u274c Only clears cookie \u2014 no server-side invalidation!\n' +
      "  res.clearCookie('ssoToken');\n" +
      "  res.json({ success: true, message: 'Logged out' });\n" +
      '});',
    exploitation: '1. Login \u2192 save JWT\n2. Logout\n3. GET /admin/dashboard with old JWT \u2192 200 + flag',
    steps: {
      en: [
        'POST /auth/login \u2192 save JWT',
        'POST /auth/logout \u2192 200',
        'GET /admin/dashboard with Authorization: Bearer <OLD_JWT> \u2192 FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
      ar: [
        'POST /auth/login \u2192 احفظ JWT',
        'POST /auth/logout \u2192 200',
        'GET /admin/dashboard \u2192 FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
      ],
    },
    fix: [
      'Token denylist: add JTI to Redis with TTL = token expiry on logout',
      'Short-lived tokens (15 min) + refresh tokens',
      'Stateful session reference: session ID in DB, delete on logout',
      'Force logout all sessions feature',
    ],
  },

  postSolve: {
    explanation: {
      en: 'JWTs are stateless \u2014 you cannot un-sign them. Server must maintain a denylist or accept tokens remain valid until expiry.',
      ar: 'JWTs \u0644\u0627 \u062a\u062d\u062a\u0641\u0638 \u0628\u062d\u0627\u0644\u0629 \u2014 \u0644\u0627 \u064a\u0645\u0643\u0646 \u0625\u0644\u063a\u0627\u0621 \u062a\u0648\u0642\u064a\u0639\u0647\u0627. \u064a\u062c\u0628 \u0639\u0644\u0649 \u0627\u0644\u062e\u0627\u062f\u0645 \u0627\u0644\u062d\u0641\u0627\u0638 \u0639\u0644\u0649 denylist.',
    },
    impact: {
      en: 'SSO token reuse: access to ALL enterprise apps even after logout, password change, or account disable.',
      ar: '\u0625\u0639\u0627\u062f\u0629 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 SSO: \u0648\u0635\u0648\u0644 \u0644\u062c\u0645\u064a\u0639 \u062a\u0637\u0628\u064a\u0642\u0627\u062a \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u062d\u062a\u0649 \u0628\u0639\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c.',
    },
    fix: [
      'JWT denylist with Redis: SETEX jti <ttl> \'revoked\' on logout',
      'Short expiry (15 min) + refresh tokens',
      'Opaque session tokens as JWT alternative',
      'Force logout all sessions feature',
    ],
  },

  hints: [
    { order: 1, xpCost: 20, ar_content: 'سجّل الدخول واحفظ JWT. ثم استدعِ /auth/logout. هل يعني ذلك أن التوكن أصبح غير صالح من جانب الخادم؟', content: 'Login and save your JWT. Call /auth/logout. Does that mean the token is invalid server-side too?' },
    { order: 2, xpCost: 40, ar_content: 'جرّب /employee/profile بدون توكن → 401. الآن جرّب مع JWT القديم في Authorization header.', content: 'Try /employee/profile without token → 401. Now try with OLD JWT in Authorization header.' },
    { order: 3, xpCost: 65, ar_content: 'GET /admin/dashboard مع JWT القديم. الخادم يتحقق فقط من التوقيع — لا denylist.', content: 'GET /admin/dashboard with old JWT. Server only validates signature — no denylist check. Should get 200.' },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_SESSION_NOT_INVALIDATED_JWT_REUSE_SSO}',
  initialState: {
    users: [
      { username: 'employee_youssef', password: 'youssef123', role: 'employee', email: 'youssef@corp.io' },
      { username: 'admin_corp', password: 'C0RP_ADM1N_2024!', role: 'admin', email: 'admin@corp.io' },
    ],
  },
};
