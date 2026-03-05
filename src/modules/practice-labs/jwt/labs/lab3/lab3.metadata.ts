// src/modules/practice-labs/jwt/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab3Metadata: LabMetadata = {
  slug: 'jwt-alg-confusion-rs256-to-hs256',
  title: 'JWT: Algorithm Confusion (RS256 → HS256)',
  ar_title: 'JWT: خلط الخوارزمية (RS256 ← HS256)',
  description:
    'Exploit an algorithm confusion vulnerability by converting an RS256 JWT to HS256, using the RSA public key as the HMAC secret to forge admin tokens and access banking admin panel.',
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

  goal: 'Download the RSA public key from /.well-known/jwks.json, use it as an HMAC secret to sign a forged HS256 token with role: "bank_admin", and access /admin/transactions to retrieve the flag.',
  scenario: {
    context:
      'SecureBank API uses RS256 (RSA asymmetric) for JWT signing. The private key is kept secret, but the public key is exposed at /.well-known/jwks.json (standard practice). The backend verification code has a flaw: it accepts both RS256 AND HS256 tokens. When an HS256 token arrives, the backend uses the RSA public key as the HMAC secret to verify it.',
    vulnerableCode: `// Backend JWT verification (vulnerable):
const algorithm = decoded.header.alg;
if (algorithm === 'HS256') {
  // ❌ Uses RSA public key as HMAC secret!
  jwt.verify(token, PUBLIC_KEY, { algorithms: ['HS256'] });
} else if (algorithm === 'RS256') {
  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
}`,
    exploitation:
      'Step 1: Download the public key from /.well-known/jwks.json. Step 2: Convert your RS256 token to HS256. Step 3: Sign it using the public key (PEM format) as the HMAC secret. The backend will verify it successfully because it uses the same public key for HS256 verification.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'First, download the public key: GET /.well-known/jwks.json. The response contains the RSA public key in JWK format. Convert it to PEM.',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'Decode your current RS256 token. Change the algorithm to "HS256" in the header, and change role to "bank_admin" in the payload.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use jwt.io or jwt_tool to sign the modified token with HS256, using the PUBLIC KEY (PEM) as the secret. Tools: jwt_tool.py -S hs256 -k public.pem',
    },
    {
      order: 4,
      xpCost: 85,
      content:
        'Send the forged HS256 token: Authorization: Bearer <token>. Request GET /admin/transactions. The flag is in the VIP transaction logs.',
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
