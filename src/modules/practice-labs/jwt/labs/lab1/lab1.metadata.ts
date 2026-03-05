// src/modules/practice-labs/jwt/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab1Metadata: LabMetadata = {
  slug: 'jwt-alg-none-bypass',
  title: 'JWT: Algorithm Confusion (None Algorithm Bypass)',
  ar_title: 'JWT: خلط الخوارزمية (تجاوز خوارزمية none)',
  description:
    'Exploit a critical JWT vulnerability where the backend accepts "alg: none" tokens, allowing you to forge authentication tokens without a signature and escalate to admin privileges.',
  ar_description:
    'استغل ثغرة JWT حرجة حيث يقبل الباكند توكنات "alg: none"، مما يسمح لك بتزوير توكنات المصادقة بدون توقيع والتصعيد إلى صلاحيات المسؤول.',
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

  goal: 'Forge a JWT token with "alg: none" and "role: admin" to access the /admin/dashboard endpoint and retrieve the flag.',
  scenario: {
    context:
      'You are logged into CloudHub API Gateway as a regular user. The platform issues JWT tokens for API authentication. The backend verifies JWT signatures but has a critical flaw: it accepts tokens with "alg": "none" (no signature). This allows attackers to craft arbitrary JWTs by simply base64-encoding the header and payload without signing.',
    vulnerableCode: `// Backend JWT verification (vulnerable):
const decoded = jwt.decode(token, { complete: true });
if (decoded.header.alg === 'none') {
  // ❌ Accepts unsigned tokens!
  return decoded.payload;
}
// Normal signature verification...`,
    exploitation:
      'Decode your current JWT token. Change the algorithm to "none" in the header, modify the payload (e.g., change role from "user" to "admin"), then re-encode without a signature. The backend will accept this forged token.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'JWT tokens have 3 parts: header.payload.signature. Decode your current token at jwt.io. Notice the "alg" field in the header.',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Change the header to {"alg":"none","typ":"JWT"} and the payload role to "admin". Base64url-encode both parts.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'For "alg: none", the signature part is EMPTY. Format: base64(header).base64(payload). (note the trailing dot)',
    },
    {
      order: 4,
      xpCost: 55,
      content:
        'Send the forged token in the Authorization header: Bearer <forged-token>. Request GET /admin/dashboard to get the flag.',
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
