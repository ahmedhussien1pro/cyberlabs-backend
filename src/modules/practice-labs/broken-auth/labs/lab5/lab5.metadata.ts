// src/modules/practice-labs/broken-auth/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab5Metadata: LabMetadata = {
  slug: 'broken-auth-mfa-bypass-race-condition-banking',
  title: 'Broken Auth: MFA Bypass — OTP Race Condition in Banking App',
  ar_title: 'Broken Auth: تجاوز MFA — Race Condition في OTP تطبيق البنك',
  description:
    'Exploit a broken MFA implementation in a banking app where the OTP verification endpoint is vulnerable to race conditions. By sending multiple concurrent OTP verification requests simultaneously, you bypass the attempt counter and brute-force the 6-digit OTP within a single time window.',
  ar_description:
    'استغل تطبيق MFA مكسور في تطبيق بنكي حيث يكون endpoint التحقق من OTP عرضة لـ race conditions. بإرسال طلبات تحقق OTP متعددة ومتزامنة في آنٍ واحد، تتجاوز عداد المحاولات وتخمن رمز OTP المكون من 6 أرقام خلال نافذة زمنية واحدة.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Race Condition',
    'MFA Bypass',
    'OTP Brute Force',
    'Concurrent Requests',
    'Banking Security',
  ],
  xpReward: 420,
  pointsReward: 210,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Login as a bank customer — the server requires a 6-digit OTP. The OTP check has a race condition: concurrent requests are processed before the attempt counter increments. Send parallel OTP guesses to bypass the 3-attempt limit and access the premium banking dashboard.',
  scenario: {
    context:
      'SecureBank app uses MFA with 6-digit OTP. The OTP endpoint allows max 3 attempts before locking. However, the check-then-increment is NOT atomic (no database transaction or mutex). By sending multiple requests simultaneously, all arrive before the counter increments — effectively allowing unlimited guesses in one burst. The OTP window is 30 seconds.',
    vulnerableCode: `// OTP verification (vulnerable race condition):
app.post('/auth/verify-otp', async (req, res) => {
  const session = await db.sessions.findOne({ id: req.body.sessionId });
  
  // ❌ Race condition: check and increment are NOT atomic
  if (session.otpAttempts >= 3) {
    return res.status(429).json({ error: 'Too many attempts' });
  }

  // ❌ Multiple concurrent requests ALL pass this check before increment!
  await db.sessions.update({ id: session.id, otpAttempts: session.otpAttempts + 1 });

  if (req.body.otp === session.expectedOtp) {
    return res.json({ success: true, token: generateFullToken(session) });
  }
  res.json({ error: 'Invalid OTP' });
});`,
    exploitation:
      '1. Login with valid credentials → get a sessionId + OTP challenge. 2. Send 10-20 concurrent POST /auth/verify-otp requests simultaneously — each with a different OTP guess. 3. All requests pass the "attempts < 3" check before any increment completes. 4. One request has the correct OTP → access granted.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Login successfully → you need OTP. Try 3 wrong OTPs sequentially — you get locked out. But what happens with concurrent requests?',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'Race condition: if 10 requests arrive simultaneously, they ALL read otpAttempts=0 before any write. They all pass the counter check.',
    },
    {
      order: 3,
      xpCost: 80,
      content:
        'Use /auth/race-otp-attack with your sessionId. It sends 10 concurrent guesses simultaneously. The correct OTP is in the 100000-999999 range.',
    },
    {
      order: 4,
      xpCost: 115,
      content:
        'POST /auth/race-otp-attack with { "sessionId": "<your_session>", "otpGuesses": ["123456", "234567", ..., "345678"] }. One will succeed before lockout.',
    },
  ],
  flagAnswer: 'FLAG{BROKEN_AUTH_MFA_BYPASS_OTP_RACE_CONDITION_BANKING}',
  initialState: {
    users: [
      {
        username: 'customer_laila',
        password: 'laila123',
        role: 'customer',
        email: 'laila@securebank.io',
      },
    ],
    banks: [
      {
        accountNo: 'BANK-LAILA-001',
        balance: 75000,
        ownerName: 'Laila Ibrahim',
      },
    ],
  },
};
