// src/modules/practice-labs/broken-auth/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab1Metadata: LabMetadata = {
  slug: 'broken-auth-credential-stuffing-streaming',
  title:
    'Broken Auth: Credential Stuffing — Streaming Platform Account Takeover',
  ar_title: 'Broken Auth: حشو بيانات الاعتماد — الاستيلاء على حساب منصة البث',
  description:
    'Exploit a broken authentication vulnerability on a streaming platform with no rate limiting or account lockout. Perform credential stuffing using a leaked password list to take over a premium subscriber account.',
  ar_description:
    'استغل ثغرة المصادقة المكسورة في منصة بث بدون rate limiting أو account lockout. قم بحشو بيانات الاعتماد باستخدام قائمة كلمات مرور مسربة للاستيلاء على حساب مشترك مميز.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Credential Stuffing',
    'Brute Force',
    'No Rate Limiting',
    'Account Lockout Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The target account is admin@streamvault.io. Use the provided leaked password list to brute force the login endpoint. There is no rate limiting, no lockout, and no CAPTCHA. Find the correct password and login to retrieve the flag.',
  scenario: {
    context:
      'StreamVault is a premium video streaming platform. The /auth/login endpoint accepts unlimited login attempts with no delay, no lockout, and no CAPTCHA. A breach on a third-party site leaked a list of commonly reused passwords. Since users reuse passwords, an attacker can try all leaked passwords against StreamVault accounts.',
    vulnerableCode: `// Login endpoint (vulnerable):
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    // ❌ No rate limiting — unlimited attempts allowed
    // ❌ No account lockout after N failed attempts
    // ❌ No CAPTCHA, no IP throttling
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: generateJWT(user) });
});`,
    exploitation:
      'Send rapid sequential POST /auth/login requests with different passwords from the leaked list. The server responds instantly to each attempt with no throttling. Eventually, the correct password is found.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try logging in multiple times with wrong passwords. Notice: no delay, no lockout. How many attempts can you make per second?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Use the /auth/leaked-passwords endpoint to get the list of commonly leaked passwords to try against admin@streamvault.io.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /auth/login repeatedly with { "email": "admin@streamvault.io", "password": "<each_password>" }. The server will respond instantly to each attempt.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'The correct password is somewhere in the leaked list. Use /auth/brute-force-simulate to automatically try all passwords and find the match.',
    },
  ],
  flagAnswer: 'FLAG{BROKEN_AUTH_CREDENTIAL_STUFFING_NO_RATE_LIMIT}',
  initialState: {
    users: [
      {
        username: 'admin_streamvault',
        password: 'Str3amV@ult2024!',
        role: 'admin',
        email: 'admin@streamvault.io',
      },
    ],
    contents: [
      {
        title: 'LEAKED_PASSWORDS',
        body: JSON.stringify([
          'password123',
          'admin1234',
          'letmein!',
          'qwerty2024',
          'Summer2024!',
          'Welcome1!',
          'Pass@word1',
          'Monkey123!',
          'Dragon2024',
          'Str3amV@ult2024!',
          'Football99',
          'Sunshine1!',
          'shadow2024',
          'master123!',
          'iloveyou!1',
        ]),
        author: 'leaked_db',
        isPublic: true,
      },
    ],
  },
};
