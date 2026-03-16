import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'cookies-lab2-hmac-cookie-forgery',
  title: 'HMAC Cookie Forgery',
  ar_title: 'تزوير الكوكيز بـ HMAC الضعيف',
  description: 'Crack a weak HMAC secret to forge a signed admin cookie and bypass authentication.',
  ar_description: 'اكسر الـ HMAC secret الضعيف لتزوير كوكيز admin موقّع وتجاوز المصادقة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cookie Security', 'HMAC', 'Brute Force', 'Cryptography'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  imageUrl: null,
  goal: 'Crack the HMAC secret, forge a cookie with role=admin, and access the admin panel.',
  ar_goal: 'اكسر الـ HMAC secret، زوّر كوكيز بـ role=admin، وادخل لوحة الإدارة.',
  flagAnswer: 'FLAG{HMAC_WEAK_SECRET_COOKIE_FORGERY}',
  briefing: {
    story: 'The app uses HMAC-SHA256 to sign cookies, but with a weak secret and a truncated signature.',
    objective: 'Brute-force the HMAC secret, forge an admin cookie with a valid signature.',
  },
  stepsOverview: [
    { step: 1, title: 'Login', description: 'POST /login to get a signed cookie' },
    { step: 2, title: 'Analyze format', description: 'Cookie = base64(payload).signature[:8]' },
    { step: 3, title: 'Crack secret', description: 'Brute-force HMAC secret (try common passwords)' },
    { step: 4, title: 'Forge cookie', description: 'Create payload with role=admin, sign with cracked secret' },
    { step: 5, title: 'Admin access', description: 'Send forged cookie and get the flag' },
  ],
  solution: {
    summary: 'Secret = "abc123". Forge cookie with role=admin, sign with HMAC-SHA256("abc123"), truncate to 8 chars.',
    steps: [
      'Try common secrets: password, 123456, abc123...',
      'Verify: HMAC(secret, payloadB64)[:8] matches the cookie signature',
      'Create new payload: {username, role:"admin"} → base64',
      'Sign with found secret',
      'Send as x-session header',
    ],
  },
  postSolve: {
    lesson: 'Use cryptographically random secrets (32+ bytes). Never truncate signatures. Consider using JWT with RS256.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Cookie format: base64(payload).sig — the signature is truncated to 8 hex chars.', xpCost: 10 },
    { order: 2, content: 'Try very common passwords as the HMAC secret: password, 123456, abc123, secret...', xpCost: 20 },
    { order: 3, content: 'The secret is "abc123". Build HMAC-SHA256 with it and forge the admin payload.', xpCost: 30 },
  ],
};
