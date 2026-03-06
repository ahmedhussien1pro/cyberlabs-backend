// src/modules/practice-labs/jwt/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab1Metadata: LabMetadata = {
  slug: 'jwt-alg-none-bypass',
  title: 'JWT: Algorithm Confusion (None Algorithm Bypass)',
  ar_title: 'JWT: خلط الخوارزمية (تجاوز خوارزمية none)',
  description:
    'Exploit a critical JWT vulnerability where the backend accepts "alg: none" tokens, allowing you to forge authentication tokens without a signature and escalate to admin privileges.',
  ar_description:
    'استغل ثغرة JWT حرجة حيث يقبل الـ backend توكنات "alg: none"، مما يسمح لك بتزوير توكنات المصادقة بدون توقيع والتصعيد إلى صلاحيات المسؤول.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'JWT Security',
    'Algorithm Confusion',
    'Token Forgery',
    'Authentication Bypass',
  ],
  xpReward: 130,
  pointsReward: 65,
  duration: 30,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Forge a JWT token with "alg: none" and "role: admin" to access the /admin/dashboard endpoint and retrieve the flag.',
  ar_goal:
    'زوّر توكن JWT بـ "alg: none" و"role: admin" للوصول إلى نقطة /admin/dashboard واسترجاع العلم.',

  briefing: {
    en: `CloudHub API Gateway — a cloud management platform.
You're logged in as user_john. A regular user.
You get a JWT token. You inspect it at jwt.io.
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "username": "user_john", "role": "user" }
The platform uses JWT for authentication. Standard practice.
But there's a quirk in the verification code.
A shortcut someone wrote "temporarily" three years ago and never removed.
It checks the algorithm field in the token header.
If it says "none"... it skips verification entirely.
No signature needed.
No secret needed.
You just have to ask nicely — with the right header.`,
    ar: `CloudHub API Gateway — منصة إدارة سحابية.
أنت مسجّل الدخول بوصفك user_john. مستخدم عادي.
تحصل على توكن JWT. تفحصه على jwt.io.
الـ Header: { "alg": "HS256", "typ": "JWT" }
الـ Payload: { "username": "user_john", "role": "user" }
تستخدم المنصة JWT للمصادقة. ممارسة قياسية.
لكن هناك طُرفة في كود التحقق.
اختصار كتبه شخص ما "مؤقتاً" قبل ثلاث سنوات ولم يُزَل أبداً.
يتحقق من حقل الخوارزمية في header التوكن.
إذا كان يقول "none"... يتخطى التحقق بالكامل.
لا حاجة لتوقيع.
لا حاجة لسر.
تحتاج فقط للسؤال بأدب — بالـ header الصحيح.`,
  },

  stepsOverview: {
    en: [
      'Log in and capture your JWT token — inspect its structure',
      'Decode the header and payload sections using base64url decoding',
      'Modify the header algorithm to "none" and change the role to "admin"',
      'Re-encode the header and payload without a signature',
      'Send the forged token to /admin/dashboard',
    ],
    ar: [
      'سجّل الدخول والتقط توكن JWT الخاص بك — افحص بنيته',
      'فكّ ترميز قسمَي الـ header والـ payload باستخدام base64url',
      'عدّل خوارزمية الـ header إلى "none" وغيّر الدور إلى "admin"',
      'أعد ترميز الـ header والـ payload بدون توقيع',
      'أرسل التوكن المزوَّر إلى /admin/dashboard',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'CloudHub backend JWT verification checks the "alg" field in the token header before verifying the signature. If alg is "none", it returns the decoded payload directly without any signature check — allowing complete token forgery.',
    vulnerableCode:
      '// Backend JWT verification (vulnerable):\n' +
      'const decoded = jwt.decode(token, { complete: true });\n' +
      "if (decoded.header.alg === 'none') {\n" +
      '  // ❌ Accepts unsigned tokens!\n' +
      '  return decoded.payload;\n' +
      '}\n' +
      '// Normal signature verification...',
    exploitation:
      'Decode your JWT. Build a new token: header = base64url({"alg":"none","typ":"JWT"}), payload = base64url({"username":"user_john","role":"admin"}). Concatenate as header.payload. (trailing dot, empty signature). Send as Bearer token.',
    steps: {
      en: [
        'Log in as user_john → receive JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Decode at jwt.io — header: {"alg":"HS256","typ":"JWT"}, payload: {"username":"user_john","role":"user"}',
        'Build new header: {"alg":"none","typ":"JWT"} → base64url encode → eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
        'Build new payload: {"username":"user_john","role":"admin"} → base64url encode',
        'Combine: <new_header>.<new_payload>. (note the trailing dot, empty signature)',
        'GET /admin/dashboard with Authorization: Bearer <forged_token> → flag returned',
      ],
      ar: [
        'سجّل الدخول بوصفك user_john → احصل على JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'فكّ الترميز على jwt.io — الـ header: {"alg":"HS256","typ":"JWT"}، الـ payload: {"username":"user_john","role":"user"}',
        'أنشئ header جديداً: {"alg":"none","typ":"JWT"} → رمّزه بـ base64url → eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
        'أنشئ payload جديداً: {"username":"user_john","role":"admin"} → رمّزه بـ base64url',
        'ادمجهما: <new_header>.<new_payload>. (لاحظ النقطة الختامية، التوقيع فارغ)',
        'GET /admin/dashboard مع Authorization: Bearer <forged_token> → يُرجَع العلم',
      ],
    },
    fix: [
      'NEVER trust the algorithm specified in the token header — always enforce a specific algorithm server-side',
      'Use: jwt.verify(token, secret, { algorithms: ["HS256"] }) — hardcode the expected algorithm',
      'Reject any token where header.alg is "none" before calling any verification function',
      'Use JWT libraries that do not accept alg: none by default (most modern libraries do this correctly)',
    ],
  },

  postSolve: {
    explanation: {
      en: 'The "alg: none" JWT vulnerability occurs when a server reads the algorithm from the token\'s own header and acts on it, rather than enforcing the expected algorithm itself. An attacker can specify "alg: none" to signal that no signature is required, completely bypassing authentication. This was a real vulnerability in multiple JWT libraries until it was patched.',
      ar: 'تحدث ثغرة JWT بـ "alg: none" عندما يقرأ الخادم الخوارزمية من header التوكن نفسه ويتصرف بناءً عليها، بدلاً من تطبيق الخوارزمية المتوقعة بنفسه. يمكن للمهاجم تحديد "alg: none" للإشارة إلى أنه لا يلزم توقيع، متجاوزاً المصادقة بالكامل. كانت هذه ثغرة حقيقية في مكتبات JWT متعددة قبل تصحيحها.',
    },
    impact: {
      en: 'Complete authentication bypass. Any user can escalate to any role (admin, superuser, etc.) by simply crafting a token with the desired claims. No credentials, no secrets, no cryptography — just base64 encoding.',
      ar: 'تجاوز كامل للمصادقة. يمكن لأي مستخدم الارتقاء إلى أي دور (أدمن، superuser، إلخ) بمجرد صياغة توكن بالادعاءات المطلوبة. لا بيانات اعتماد، لا أسرار، لا تشفير — مجرد ترميز base64.',
    },
    fix: [
      'Server must specify allowed algorithms explicitly: { algorithms: ["HS256"] }',
      'Reject tokens where alg header is "none" or "None" or "NONE" at the middleware layer',
      'Principle: the server decides which algorithm to use, not the client',
      'Security audit: test every JWT endpoint with alg:none tokens as part of your checklist',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'JWT tokens have 3 parts: header.payload.signature. Decode your current token at jwt.io. Notice the "alg" field in the header — what happens if you change it?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Change the header to {"alg":"none","typ":"JWT"} and change role to "admin" in the payload. Base64url-encode both parts separately.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'For "alg: none", the signature is EMPTY. Your forged token format is: base64url(header).base64url(payload). — note the trailing dot with nothing after it.',
    },
  ],

  flagAnswer: 'FLAG{JWT_ALG_NONE_UNSIGNED_TOKEN_BYPASS}',
  initialState: {
    users: [
      { username: 'user_john', password: 'john123', role: 'user' },
      { username: 'admin_root', password: 'ADM1N_S3CUR3!', role: 'admin' },
    ],
  },
};
