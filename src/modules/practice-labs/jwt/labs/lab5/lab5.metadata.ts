// src/modules/practice-labs/jwt/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab5Metadata: LabMetadata = {
  slug: 'jwt-jku-injection-ssrf',
  title: 'JWT: JKU Header Injection + Remote JWK Set Poisoning',
  ar_title: 'JWT: حقن header الـ JKU + تسميم مجموعة JWK البعيدة',
  description:
    'Exploit a JWT JKU (JWK Set URL) header injection vulnerability combined with SSRF to host a malicious JWK set, forcing the backend to verify forged tokens against your own public key.',
  ar_description:
    'استغل ثغرة حقن JKU (عنوان URL لمجموعة JWK) في JWT مع SSRF لاستضافة مجموعة JWK خبيثة، مما يُجبر الـ backend على التحقق من توكناتك المزوَّرة باستخدام مفتاحك العام.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'JWT JKU Injection',
    'SSRF',
    'JWK Set Poisoning',
    'Advanced Cryptographic Attacks',
    'Microservices Security',
  ],
  xpReward: 380,
  pointsReward: 190,
  duration: 70,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Generate your own RSA keypair, create a malicious JWK set, host it at a URL you control (simulated via /exploit/jwks), inject the "jku" header pointing to your URL, sign a forged admin token, and access /admin/services to retrieve the flag.',
  ar_goal:
    'أنشئ زوج مفاتيح RSA الخاص بك، أنشئ مجموعة JWK خبيثة، استضفها على URL تتحكم فيه (محاكاة عبر /exploit/jwks)، احقن jku header يشير إلى URL الخاص بك، وقّع توكن مسؤول مزوَّر، وصل إلى /admin/services لاسترجاع العلم.',

  briefing: {
    en: `MicroGate API Gateway — routing and authentication for microservices.
You're service_client. Your JWT has no "jku" header by default.
jku (JWK Set URL) is an optional JWT header that tells the backend:
"Go fetch the public key for verifying me from THIS URL."
Convenient for dynamic key discovery in microservice environments.
The backend has a simple policy: fetch keys from the jku URL. No validation.
No domain whitelist. No SSRF protection.
You can host your OWN JWK set.
You can sign a JWT with your OWN private key.
You can point jku to where your JWK set lives.
The backend fetches YOUR key, verifies YOUR token.
Successfully.`,
    ar: `MicroGate API Gateway — توجيه ومصادقة لـ microservices.
أنت service_client. JWT الخاص بك لا يحتوي على jku header بشكل افتراضي.
jku (عنوان URL لمجموعة JWK) هو header JWT اختياري يخبر الـ backend:
"اذهب لجلب المفتاح العام للتحقق مني من هذا الـ URL."
مناسب لاكتشاف المفاتيح الديناميكي في بيئات microservice.
للـ backend سياسة بسيطة: يجلب المفاتيح من jku URL. بدون تحقق.
لا قائمة بيضاء للنطاقات. لا حماية من SSRF.
يمكنك استضافة مجموعة JWK الخاصة بك.
يمكنك توقيع JWT بمفتاحك الخاص.
يمكنك توجيه jku إلى مكان مجموعة JWK الخاصة بك.
يجلب الـ backend مفتاحك، يتحقق من توكنك.
بنجاح.`,
  },

  stepsOverview: {
    en: [
      'Understand the JKU header and how the backend fetches public keys from remote URLs',
      "Generate a new RSA keypair using the lab's /exploit/generate-keypair endpoint",
      'The lab automatically hosts your public key as a JWK set at /exploit/jwks',
      'Build a JWT with jku pointing to your hosted JWK set, signed with your private key',
      'The backend fetches your JWK set, finds your public key, verifies your signature successfully',
      'Access /admin/services with the forged admin token',
    ],
    ar: [
      'افهم jku header وكيف يجلب الـ backend مفاتيح عامة من URLs بعيدة',
      'أنشئ زوج مفاتيح RSA جديداً باستخدام نقطة /exploit/generate-keypair الخاصة بالمختبر',
      'يستضيف المختبر تلقائياً مفتاحك العام كمجموعة JWK في /exploit/jwks',
      'أنشئ JWT مع jku يشير إلى مجموعة JWK المستضافة، موقَّعاً بمفتاحك الخاص',
      'يجلب الـ backend مجموعة JWK الخاصة بك، يجد مفتاحك العام، يتحقق من توقيعك بنجاح',
      'صل إلى /admin/services بتوكن المسؤول المزوَّر',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'MicroGate API Gateway fetches JWT verification keys from the URL in the "jku" header without domain validation. An attacker generates their own RSA keypair, hosts the public key as a JWK set at a URL they control (the lab provides /exploit/jwks for this), signs a forged admin JWT with their private key, and injects jku pointing to their JWK set. The backend fetches and trusts the attacker\'s key.',
    vulnerableCode:
      '// Backend JWK fetching (vulnerable):\n' +
      'const jkuUrl = decoded.header.jku;\n' +
      '// ❌ No URL validation — allows arbitrary external URLs\n' +
      'const response = await fetch(jkuUrl);\n' +
      'const jwks = await response.json();\n' +
      'const key = jwks.keys.find(k => k.kid === decoded.header.kid);\n' +
      "jwt.verify(token, jwkToPem(key), { algorithms: ['RS256'] });",
    exploitation:
      '1. POST /exploit/generate-keypair → { privateKey, publicKey, jwksUrl: "/exploit/jwks", kid: "exploit-key-1" }\n' +
      '2. Build JWT: header {"alg":"RS256","typ":"JWT","jku":"<lab_base_url>/exploit/jwks","kid":"exploit-key-1"}\n' +
      '   payload {"username":"service_client","role":"admin"}\n' +
      '3. Sign with attacker private key.\n' +
      '4. GET /admin/services → backend fetches /exploit/jwks → finds exploit-key-1 → verifies with attacker public key → 200 OK → flag.',
    steps: {
      en: [
        'POST /exploit/generate-keypair → receive { privateKey, kid: "exploit-key-1", jwksHostedAt: "<lab_url>/exploit/jwks" }',
        'Build JWT header: { "alg": "RS256", "typ": "JWT", "jku": "<lab_url>/exploit/jwks", "kid": "exploit-key-1" }',
        'Build payload: { "username": "service_client", "role": "admin" }',
        'Sign with attacker private key using RS256',
        'GET /admin/services Authorization: Bearer <forged_token> → backend fetches your JWK → 200 OK → flag in services config',
      ],
      ar: [
        'POST /exploit/generate-keypair → احصل على { privateKey, kid: "exploit-key-1", jwksHostedAt: "<lab_url>/exploit/jwks" }',
        'أنشئ JWT header: { "alg": "RS256", "typ": "JWT", "jku": "<lab_url>/exploit/jwks", "kid": "exploit-key-1" }',
        'أنشئ الـ payload: { "username": "service_client", "role": "admin" }',
        'وقّع بالمفتاح الخاص للمهاجم باستخدام RS256',
        'GET /admin/services Authorization: Bearer <forged_token> → يجلب الـ backend مجموعة JWK الخاصة بك → 200 OK → العلم في إعدادات الخدمات',
      ],
    },
    fix: [
      'Never fetch JWK sets from URLs supplied in the JWT header itself',
      'Maintain a pre-configured whitelist of trusted JWK set URLs — reject any jku not in the list',
      'Ignore the jku header entirely — load trusted public keys from local config or secure internal URLs only',
      'If jku is needed: validate domain against: jkuUrl.startsWith("https://api.company.com/") before fetching',
    ],
  },

  postSolve: {
    explanation: {
      en: "JKU (JWK Set URL) injection is a Server-Side Request Forgery combined with JWT key substitution. The attacker weaponizes the backend's key-fetching behavior by supplying a malicious URL. Since the attacker controls both the private key (for signing) and the public key (fetched by the server), any token they sign will be verified as legitimate. This attack requires zero knowledge of the server's real keys.",
      ar: 'حقن JKU (عنوان URL لمجموعة JWK) هو طلب من جانب الخادم (SSRF) مدمج مع استبدال مفتاح JWT. يسلّح المهاجم سلوك جلب المفاتيح في الـ backend بتوفير URL خبيث. نظراً لأن المهاجم يتحكم في كل من المفتاح الخاص (للتوقيع) والمفتاح العام (الذي يجلبه الخادم)، فإن أي توكن يوقّعه سيُتحقق منه كشرعي. لا يتطلب هذا الهجوم أي معرفة بالمفاتيح الحقيقية للخادم.',
    },
    impact: {
      en: 'The most powerful JWT attack — zero knowledge, zero brute force. The attacker generates fresh keys and completely controls the verification process. In microservice environments where JKU is used for service-to-service auth, this allows a compromised client to impersonate any service with any permission level.',
      ar: 'الهجوم الأقوى على JWT — بدون معرفة مسبقة، بدون قوة غاشمة. يولّد المهاجم مفاتيح جديدة ويتحكم كلياً في عملية التحقق. في بيئات microservice حيث يُستخدَم JKU للمصادقة بين الخدمات، يسمح هذا لعميل مخترَق بانتحال هوية أي خدمة بأي مستوى صلاحية.',
    },
    fix: [
      'Never allow jku header from client-controlled JWT — it is an SSRF vector by design if unvalidated',
      'If key rotation is needed: use a configuration-level JWKS URL, not a per-token header',
      'Domain pinning: validate jku against a hardcoded trusted domain list before any HTTP fetch',
      'Use kid-based key lookup from a local key store instead of remote URL fetching',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'The backend fetches JWT verification keys from the "jku" URL in the token header. There is no URL validation. You can add a "jku" field to your token header pointing to ANY URL you control.',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'Use POST /exploit/generate-keypair to get a fresh RSA keypair. The lab automatically hosts your public key as a JWK set at /exploit/jwks. Use that URL as your jku value.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'Build your JWT: header = { alg: "RS256", jku: "<lab_url>/exploit/jwks", kid: "exploit-key-1" }, payload = { role: "admin" }. Sign with the private key from generate-keypair. The backend fetches YOUR JWK set and trusts YOUR key.',
    },
  ],

  flagAnswer: 'FLAG{JWT_JKU_SSRF_REMOTE_JWK_POISONING_PWNED}',
  initialState: {
    users: [
      { username: 'service_client', password: 'client123', role: 'service' },
      { username: 'gateway_admin', password: 'G4T3W4Y_4DM1N!', role: 'admin' },
    ],
    logs: [
      {
        action: 'SERVICE_REQUEST',
        meta: {
          service: 'payment-api',
          endpoint: '/process-payment',
          status: 'success',
          timestamp: '2026-03-04T12:00:00Z',
        },
      },
    ],
  },
};
