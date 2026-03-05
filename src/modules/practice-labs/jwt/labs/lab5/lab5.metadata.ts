// src/modules/practice-labs/jwt/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab5Metadata: LabMetadata = {
  slug: 'jwt-jku-injection-ssrf',
  title: 'JWT: JKU Header Injection + Remote JWK Set Poisoning',
  ar_title: 'JWT: حقن رأس JKU + تسميم مجموعة JWK البعيدة',
  description:
    'Exploit a JWT JKU (JWK Set URL) header injection vulnerability combined with SSRF to host a malicious JWK set, forcing the backend to verify your forged tokens against your own public key.',
  ar_description:
    'استغل ثغرة حقن رأس JKU (عنوان URL لمجموعة JWK) في JWT مع SSRF لاستضافة مجموعة JWK خبيثة، مما يجبر الباكند على التحقق من توكناتك المزورة باستخدام مفتاحك العام.',
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

  goal: 'Generate your own RSA keypair, create a malicious JWK set, host it at a URL you control (simulated via /exploit/jwks endpoint), inject the "jku" header pointing to your URL, sign a forged admin token, and access /admin/services to retrieve the flag.',
  scenario: {
    context:
      'MicroGate API Gateway uses JWT for inter-service authentication. To support dynamic key rotation, the gateway accepts a "jku" (JWK Set URL) header that points to a JSON Web Key Set. The backend fetches keys from this URL without validation. An attacker can host their own JWK set and force the backend to verify tokens against the attacker\'s public key.',
    vulnerableCode: `// Backend JWK fetching (vulnerable):
const jkuUrl = decoded.header.jku;
// ❌ No URL validation — allows arbitrary external URLs
const response = await fetch(jkuUrl);
const jwks = await response.json();
// Uses fetched keys to verify token
const key = jwks.keys.find(k => k.kid === decoded.header.kid);
jwt.verify(token, jwkToPem(key), { algorithms: ['RS256'] });`,
    exploitation:
      'Step 1: Generate RSA keypair (openssl or online tool). Step 2: Create JWK set with your public key. Step 3: Host it at /exploit/jwks (provided by the lab). Step 4: Create JWT with "jku": "https://lab.example.com/exploit/jwks", sign with your private key. Step 5: The backend fetches YOUR public key and verifies YOUR signature successfully.',
  },
  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'Decode your JWT. Notice there\'s no "jku" field by default. You need to ADD it to the header: {"alg":"RS256","typ":"JWT","jku":"<your-url>","kid":"exploit-key-1"}',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'Generate an RSA keypair: POST /exploit/generate-keypair. The lab will return a keypair and a pre-built JWK set hosted at /exploit/jwks.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'Use the generated private key to sign a JWT with header: {"alg":"RS256","jku":"<lab-url>/exploit/jwks","kid":"exploit-key-1"} and payload: {"username":"user","role":"admin"}.',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        'Full exploit: POST /exploit/generate-keypair → get privateKey. Sign JWT with that key. Add "jku" header pointing to /exploit/jwks. Send to /admin/services with Authorization: Bearer <token>.',
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
