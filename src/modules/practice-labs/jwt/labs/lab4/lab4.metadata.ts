// src/modules/practice-labs/jwt/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab4Metadata: LabMetadata = {
  slug: 'jwt-kid-path-traversal',
  title: 'JWT: Key ID (kid) Header Injection — Path Traversal',
  ar_title: 'JWT: حقن معرف المفتاح (kid) — اجتياز المسار',
  description:
    'Exploit a JWT key ID (kid) parameter injection vulnerability to perform path traversal, forcing the backend to use a predictable file (like /dev/null) as the signing key to forge admin tokens.',
  ar_description:
    'استغل ثغرة حقن معامل معرف المفتاح (kid) في JWT لتنفيذ اجتياز المسار، مما يجبر الباكند على استخدام ملف متوقع (مثل /dev/null) كمفتاح التوقيع لتزوير توكنات المسؤول.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'JWT kid Injection',
    'Path Traversal',
    'File System Exploitation',
    'Advanced Token Forgery',
  ],
  xpReward: 310,
  pointsReward: 155,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Inject a malicious "kid" header pointing to a predictable file (/dev/null or a known static file), sign a forged admin JWT using that file\'s content as the key, and access /admin/users to retrieve the flag.',
  scenario: {
    context:
      'CloudVault SaaS uses JWT with a custom "kid" (Key ID) header to support key rotation. The backend loads the signing key from disk based on the kid value: fs.readFileSync(`/keys/${kid}.pem`). This is vulnerable to path traversal. By injecting "../../../dev/null" or similar, you can force the backend to use a predictable file as the key.',
    vulnerableCode: `// Backend key loading (vulnerable):
const kid = decoded.header.kid;
const keyPath = path.join('/keys', kid + '.pem');
// ❌ No sanitization — allows ../../../etc/passwd
const key = fs.readFileSync(keyPath, 'utf8');
jwt.verify(token, key, { algorithms: ['HS256'] });`,
    exploitation:
      'Step 1: Modify your JWT header to include "kid": "../../../../dev/null" (empty file). Step 2: Sign the token using an empty string as the HMAC secret (since /dev/null is empty). Step 3: The backend will load /dev/null as the key and verify your token successfully.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Decode your JWT. Notice the "kid" field in the header. This tells the backend which key file to use. What if you change it to a path like "../../etc/passwd"?',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'The backend joins kid with /keys/ directory. Try "kid": "../../../../dev/null" to escape the directory. /dev/null is an empty file (0 bytes).',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'If the key file is empty, the HMAC secret is an empty string. Sign your forged token using an empty secret: jwt.sign(payload, "", { algorithm: "HS256", header: { kid: "../../../../dev/null" } })',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'Full exploit: Header: {"alg":"HS256","typ":"JWT","kid":"../../../../dev/null"}, Payload: {"username":"user","role":"admin"}. Sign with empty string. Access /admin/users with forged token.',
    },
  ],

  flagAnswer: 'FLAG{JWT_KID_PATH_TRAVERSAL_ADMIN_PWNED}',
  initialState: {
    users: [
      { username: 'user_bob', password: 'bobpass', role: 'user' },
      { username: 'sysadmin', password: 'SYS_4DM1N_R00T!', role: 'admin' },
    ],
    contents: [
      {
        title: 'Project Alpha',
        body: 'User-level project',
        author: 'user_bob',
        isPublic: false,
      },
      {
        title: 'Admin Config',
        body: JSON.stringify({
          secrets: ['FLAG{JWT_KID_PATH_TRAVERSAL_ADMIN_PWNED}'],
          apiKeys: ['admin-api-key-12345'],
        }),
        author: 'sysadmin',
        isPublic: false,
      },
    ],
  },
};
