// src/modules/practice-labs/broken-auth/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab2Metadata: LabMetadata = {
  slug: 'broken-auth-remember-me-token-forgery-travel',
  title:
    'Broken Auth: Predictable Remember-Me Token — Travel Booking Account Takeover',
  ar_title:
    'Broken Auth: توكن Remember-Me قابل للتنبؤ — الاستيلاء على حساب حجز السفر',
  description:
    'Exploit a broken authentication vulnerability in a travel booking platform where the persistent "remember me" token is generated using a weak, predictable algorithm. Forge a valid remember-me token for an admin account and gain persistent access.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في منصة حجز سفر حيث يتم إنشاء توكن remember-me باستخدام خوارزمية ضعيفة وقابلة للتنبؤ. قم بتزوير توكن remember-me صالح لحساب المسؤول واحصل على وصول دائم.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Token Forgery',
    'Predictable Token',
    'Persistent Session Attack',
    'Cryptographic Weakness',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Analyze your own remember-me token to discover the weak generation algorithm (Base64 of email:role:date). Forge a token for admin@flytrek.io with role admin and use it to access the admin dashboard.',
  scenario: {
    context:
      'FlyTrek travel booking platform offers a "Remember Me" feature. The remember-me token is generated as: Base64(email + ":" + role + ":" + timestamp_day). It is stored as a cookie and accepted directly without server-side validation against a database. An attacker who understands the pattern can craft valid tokens for any account.',
    vulnerableCode: `// Remember-me token generation (vulnerable):
function generateRememberToken(email: string, role: string): string {
  const day = Math.floor(Date.now() / 86400000); // day number
  // ❌ Predictable: just Base64 of known values
  return Buffer.from(\`\${email}:\${role}:\${day}\`).toString('base64');
}

// Remember-me validation (vulnerable):
app.get('/auth/remember-login', async (req, res) => {
  const token = req.cookies.rememberMe;
  // ❌ Decodes and trusts without DB lookup!
  const decoded = Buffer.from(token, 'base64').toString();
  const [email, role] = decoded.split(':');
  req.session.user = { email, role }; // Trust decoded values directly
  res.json({ success: true, user: { email, role } });
});`,
    exploitation:
      '1. Login to get your own remember-me token. 2. Decode it from Base64 → understand the pattern. 3. Forge: Base64("admin@flytrek.io:admin:<today_day>"). 4. Send forged token to /auth/remember-login.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Login and call /auth/get-remember-token. Decode the returned token from Base64. What do you see inside?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'The token is Base64(email:role:dayNumber). The day number is Math.floor(Date.now() / 86400000). Can you craft a token for admin@flytrek.io?',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use /auth/forge-token with { "email": "admin@flytrek.io", "role": "admin" } to generate the forged token using the discovered algorithm.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'POST /auth/remember-login with { "rememberToken": "<forged_token>" }. The server decodes it without DB validation and logs you in as admin.',
    },
  ],
  flagAnswer: 'FLAG{BROKEN_AUTH_PREDICTABLE_REMEMBER_ME_TOKEN_FORGED}',
  initialState: {
    users: [
      {
        username: 'traveler_nour',
        password: 'nour123',
        role: 'user',
        email: 'nour@flytrek.io',
      },
      {
        username: 'admin_flytrek',
        password: 'FLY_ADM1N_S3CR3T!',
        role: 'admin',
        email: 'admin@flytrek.io',
      },
    ],
  },
};
