// src/modules/practice-labs/jwt/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab3Metadata: LabMetadata = {
  slug: 'jwt-alg-confusion-rs256-to-hs256',
  title: 'JWT: Algorithm Confusion (RS256 → HS256)',
  ar_title: 'JWT: خلط الخوارزمية (RS256 → HS256)',
  description:
    'Exploit an algorithm confusion vulnerability by converting an RS256 JWT to HS256, using the RSA public key as the HMAC secret to forge admin tokens and access a banking admin panel.',
  ar_description:
    'استغل ثغرة خلط الخوارزمية بتحويل JWT من RS256 إلى HS256، باستخدام المفتاح العام RSA كسر HMAC لتزوير توكنات المسؤول والوصول إلى لوحة إدارة البنك.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'JWT Algorithm Confusion',
    'Cryptographic Attacks',
    'RS256 vs HS256',
    'Public Key Exploitation',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 50,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Download the RSA public key from /.well-known/jwks.json, use it as an HMAC secret to sign a forged HS256 token with role: "bank_admin", and access /admin/transactions to retrieve the flag.',
  ar_goal:
    'حمّل مفتاح RSA العام من /.well-known/jwks.json، استخدمه كسر HMAC لتوقيع توكن HS256 مزوَّر بـ role: "bank_admin"، وصل إلى /admin/transactions لاسترجاع العلم.',

  briefing: {
    en: `SecureBank API — digital banking for enterprise clients.
You're customer_alice. Your JWT uses RS256 — asymmetric cryptography.
The bank holds the private key (signs). The public key is at /.well-known/jwks.json (verifies).
This is industry standard. The public key is meant to be public. No problem.
Except there's a flaw in how the verification code handles algorithms.
It accepts both RS256 AND HS256.
When an HS256 token arrives, the backend grabs the RSA public key for HMAC verification.
Wait. It uses the RSA PUBLIC KEY as the HMAC secret?
That means: if you take the public key (which you can freely download)...
and use it as the secret to sign an HS256 token...
the server will verify it successfully.
You have everything you need. It's all public.`,
    ar: `SecureBank API — خدمات بنكية رقمية للعملاء المؤسسيين.
أنت customer_alice. JWT الخاص بك يستخدم RS256 — تشفير غير متماثل.
البنك يحتفظ بالمفتاح الخاص (التوقيع). المفتاح العام في /.well-known/jwks.json (التحقق).
هذا معيار الصناعة. المفتاح العام مقصود أن يكون عاماً. لا مشكلة.
إلا أن هناك خللاً في كيفية تعامل كود التحقق مع الخوارزميات.
يقبل كلاً من RS256 وHS256.
عندما يصل توكن HS256، يأخذ الـ backend مفتاح RSA العام للتحقق عبر HMAC.
انتظر. يستخدم مفتاح RSA العام كسر HMAC؟
هذا يعني: إن أخذت المفتاح العام (الذي يمكنك تحميله بحرية)...
واستخدمته كسر لتوقيع توكن HS256...
سيتحقق منه الخادم بنجاح.
لديك كل ما تحتاجه. كل شيء عام.`,
  },

  stepsOverview: {
    en: [
      'Log in and capture your RS256 JWT token',
      'Download the RSA public key from /.well-known/jwks.json and convert to PEM format',
      'Understand why HS256 + public key = forgeable: the server uses public key as HMAC secret',
      'Build a new JWT with alg: HS256, role: bank_admin — sign using the public key (PEM) as the HMAC secret',
      'Send the forged token to /admin/transactions',
    ],
    ar: [
      'سجّل الدخول والتقط توكن RS256 الخاص بك',
      'حمّل مفتاح RSA العام من /.well-known/jwks.json وحوّله إلى صيغة PEM',
      'افهم لماذا HS256 + المفتاح العام = قابل للتزوير: الخادم يستخدم المفتاح العام كسر HMAC',
      'أنشئ JWT جديداً بـ alg: HS256 وrole: bank_admin — وقّعه باستخدام المفتاح العام (PEM) كسر HMAC',
      'أرسل التوكن المزوَّر إلى /admin/transactions',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SecureBank backend accepts both RS256 and HS256 JWT algorithms. When processing an HS256 token, it uses the stored RSA public key as the HMAC secret for verification. Since the RSA public key is publicly accessible at /.well-known/jwks.json, any attacker can use it to sign arbitrary HS256 tokens that pass verification.',
    vulnerableCode:
      '// Backend JWT verification (vulnerable):\n' +
      'const algorithm = decoded.header.alg;\n' +
      "if (algorithm === 'HS256') {\n" +
      '  // ❌ Uses RSA public key as HMAC secret!\n' +
      "  jwt.verify(token, PUBLIC_KEY, { algorithms: ['HS256'] });\n" +
      "} else if (algorithm === 'RS256') {\n" +
      "  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });\n" +
      '}',
    exploitation:
      '1. GET /.well-known/jwks.json → download RSA public key in JWK format.\n' +
      '2. Convert JWK to PEM format (online tool or openssl).\n' +
      '3. Build token: header {"alg":"HS256","typ":"JWT"}, payload {"username":"customer_alice","role":"bank_admin"}.\n' +
      '4. Sign using HMAC-SHA256 with PUBLIC KEY PEM bytes as the secret.\n' +
      '5. GET /admin/transactions with forged token → flag in VIP transaction logs.',
    steps: {
      en: [
        'POST /auth/login → receive RS256 JWT token',
        'GET /.well-known/jwks.json → RSA public key in JWK format',
        'Convert JWK to PEM: use /utils/jwk-to-pem endpoint or jwt.io PEM export',
        'Sign new token: jwt.sign({ "username": "customer_alice", "role": "bank_admin" }, PUBLIC_KEY_PEM, { algorithm: "HS256" })',
        'GET /admin/transactions Authorization: Bearer <forged_hs256_token> → flag in VIP transaction log',
      ],
      ar: [
        'POST /auth/login → احصل على توكن RS256 JWT',
        'GET /.well-known/jwks.json → مفتاح RSA العام بصيغة JWK',
        'حوّل JWK إلى PEM: استخدم نقطة /utils/jwk-to-pem أو تصدير PEM في jwt.io',
        'وقّع توكناً جديداً: jwt.sign({ "username": "customer_alice", "role": "bank_admin" }, PUBLIC_KEY_PEM, { algorithm: "HS256" })',
        'GET /admin/transactions Authorization: Bearer <forged_hs256_token> → العلم في سجل معاملات VIP',
      ],
    },
    fix: [
      'Hardcode the expected algorithm — never read it from the token header: jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] })',
      'Never accept both symmetric (HS256) and asymmetric (RS256) algorithms on the same endpoint',
      'Use separate verification paths with separate keys for different authentication contexts',
      'Security test: attempt HS256 token with public key — should return 401, not 200',
    ],
  },

  postSolve: {
    explanation: {
      en: 'The RS256→HS256 algorithm confusion attack exploits a backend that accepts both symmetric and asymmetric JWT algorithms. When the attacker submits an HS256 token, the server uses the RSA public key as the HMAC secret. Since the public key is openly available, the attacker uses it as the signing secret — creating a token the server will accept as valid. This was a real vulnerability in numerous JWT libraries (CVE-2016-5431 class).',
      ar: 'يستغل هجوم خلط خوارزمية RS256→HS256 backend يقبل كلاً من خوارزميات JWT المتماثلة وغير المتماثلة. عندما يقدّم المهاجم توكن HS256، يستخدم الخادم مفتاح RSA العام كسر HMAC. نظراً لأن المفتاح العام متاح بشكل مفتوح، يستخدمه المهاجم كسر توقيع — منشئاً توكناً سيقبله الخادم كصالح. كانت هذه ثغرة حقيقية في مكتبات JWT عديدة (فئة CVE-2016-5431).',
    },
    impact: {
      en: 'Complete token forgery using only publicly available information. No brute force, no secret extraction — the attack uses the intentionally public RSA key as a weapon. Any authenticated user can forge tokens for any role including admin.',
      ar: 'تزوير توكن كامل باستخدام المعلومات المتاحة للعموم فقط. لا قوة غاشمة، لا استخراج أسرار — يستخدم الهجوم مفتاح RSA العام المقصود عمداً كسلاح. يمكن لأي مستخدم مصادَق عليه تزوير توكنات لأي دور بما في ذلك المسؤول.',
    },
    fix: [
      'Algorithm must be server-specified, not client-specified',
      'Never mix symmetric and asymmetric algorithms on the same endpoint',
      'Enforce algorithm at verification: always pass { algorithms: ["RS256"] } explicitly',
      'Disable HS256 entirely on APIs that use RS256 — they should never coexist for the same resource',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Download the public key: GET /.well-known/jwks.json. This is standard and public. Now: what if you used this public key as an HMAC secret to sign an HS256 token?',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        "The backend accepts both RS256 and HS256. When it receives HS256, it uses the RSA public key as the HMAC secret for verification. You have that public key. That's your signing secret.",
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use jwt_tool: python3 jwt_tool.py <token> -S hs256 -k public.pem — this signs your modified payload with the public key as HMAC. Then send it as your Authorization token.',
    },
  ],

  flagAnswer: 'FLAG{JWT_ALG_CONFUSION_RS256_TO_HS256_BANK_PWNED}',
  initialState: {
    users: [
      { username: 'customer_alice', password: 'alice2024', role: 'customer' },
      {
        username: 'bank_admin',
        password: 'B4NK_4DM1N_S3CUR3!',
        role: 'bank_admin',
      },
    ],
    banks: [
      { accountNo: 'CUST-001', balance: 15000, ownerName: 'Alice Johnson' },
      {
        accountNo: 'VIP-ADMIN-001',
        balance: 9999999,
        ownerName: 'Bank Administrator',
      },
    ],
  },
};
