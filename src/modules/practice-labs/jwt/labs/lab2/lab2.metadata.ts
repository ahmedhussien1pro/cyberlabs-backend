// src/modules/practice-labs/jwt/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab2Metadata: LabMetadata = {
  slug: 'jwt-weak-secret-crack',
  title: 'JWT: Weak Secret Brute Force Attack',
  ar_title: 'JWT: هجوم القوة الغاشمة على السر الضعيف',
  description:
    'Crack a weak HMAC secret used to sign JWT tokens through offline brute-force attack, then forge an admin token to access premium course content.',
  ar_description:
    'اكسر سرًا ضعيفًا لـ HMAC المستخدم لتوقيع توكنات JWT من خلال هجوم القوة الغاشمة دون اتصال، ثم قم بتزوير توكن مسؤول للوصول إلى محتوى الدورات المميزة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'JWT Security',
    'Cryptographic Attacks',
    'Brute Force',
    'HMAC Weakness',
  ],
  xpReward: 230,
  pointsReward: 115,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: "Crack the weak JWT signing secret (hint: it's in rockyou.txt top 1000), forge an admin token, and access the /premium/courses endpoint to retrieve the flag from the executive cybersecurity course.",
  scenario: {
    context:
      'EduLearn Platform uses JWT tokens signed with HS256 (HMAC-SHA256). As a free-tier student, you can access basic courses but not premium content. The platform uses a weak secret for signing JWTs. By cracking the secret offline, you can forge tokens with elevated privileges.',
    vulnerableCode: `// Backend JWT signing (vulnerable):
const secret = 'secret123'; // ❌ Weak, commonly used secret
const token = jwt.sign({ userId, role }, secret, { algorithm: 'HS256' });`,
    exploitation:
      'Capture your JWT token. Use tools like jwt_tool, hashcat, or john to brute-force the HMAC secret. Common wordlists: rockyou.txt, SecLists. Once cracked, sign a new token with role: "admin" using the discovered secret.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Your token uses HS256 (HMAC). This means the same secret is used for both signing and verification. If the secret is weak, you can crack it offline.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Use jwt_tool: python3 jwt_tool.py <token> -C -d /path/to/wordlist.txt. Or use the built-in /crack endpoint with a wordlist.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'The secret is a common weak password. Try the built-in wordlist endpoint: POST /jwt/crack with your token. The secret is revealed as: "secret123".',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Forge a new token: header: {"alg":"HS256","typ":"JWT"}, payload: {"username":"user_john","role":"admin"}. Sign with secret "secret123". Access /premium/courses with the forged token.',
    },
  ],

  flagAnswer: 'FLAG{JWT_WEAK_SECRET_CRACKED_HS256_ADMIN}',
  initialState: {
    users: [
      { username: 'student_john', password: 'johnpass', role: 'student' },
      {
        username: 'instructor_admin',
        password: 'ADM1N_T34CH3R!',
        role: 'admin',
      },
    ],
    contents: [
      {
        title: 'Introduction to Cybersecurity',
        body: 'Free course — basics of security',
        author: 'free',
        isPublic: true,
      },
      {
        title: 'Advanced Penetration Testing',
        body: JSON.stringify({
          title: 'Executive Pentest Masterclass',
          description:
            'Premium content — FLAG{JWT_WEAK_SECRET_CRACKED_HS256_ADMIN}',
          modules: 12,
          duration: '40 hours',
        }),
        author: 'premium',
        isPublic: false,
      },
    ],
  },
};
