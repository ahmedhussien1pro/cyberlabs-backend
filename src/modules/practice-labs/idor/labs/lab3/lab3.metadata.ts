// src/modules/practice-labs/idor/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab3Metadata: LabMetadata = {
  slug: 'idor-password-reset-flow',
  title: 'IDOR: Password Reset — Account Takeover via userId Manipulation',
  ar_title:
    'IDOR: إعادة تعيين كلمة المرور — الاستيلاء على الحساب عبر التلاعب بـ userId',
  description:
    "Exploit an IDOR vulnerability in the password reset flow where the reset endpoint accepts a userId parameter directly, allowing you to reset any account's password — including the admin account.",
  ar_description:
    'استغل ثغرة IDOR في تدفق إعادة تعيين كلمة المرور حيث يقبل endpoint إعادة التعيين معامل userId مباشرة، مما يتيح لك إعادة تعيين كلمة مرور أي حساب بما فيه حساب المسؤول والاستيلاء عليه بالكامل.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'IDOR',
    'Account Takeover',
    'Password Reset Abuse',
    'Authentication Bypass',
  ],
  xpReward: 250,
  pointsReward: 125,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "Trigger a password reset for your own account, intercept the reset token, then manipulate the userId parameter in the /reset-password endpoint to reset the admin account's password instead.",
  scenario: {
    context:
      "CloudBase SaaS sends password reset emails with tokens. The reset endpoint /reset-password accepts both a token AND a userId. The backend validates the token format but binds it to the userId FROM THE REQUEST rather than from the token's own embedded data. This allows swapping the userId while keeping a valid token.",
    vulnerableCode: `// Password reset (vulnerable):
app.post('/reset-password', async (req, res) => {
  const { token, userId, newPassword } = req.body;
  const resetRecord = await db.resetTokens.findOne({ token });
  if (!resetRecord || resetRecord.expired) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  // ❌ Uses userId from REQUEST BODY, not from the token record!
  await db.users.update({ id: userId, password: hash(newPassword) });
  res.json({ success: true });
});`,
    exploitation:
      "1. Request a password reset for your own account (user_john). 2. Get the reset token from /get-token endpoint (lab simulation). 3. Call /reset-password with your valid token BUT change userId to the admin's userId. 4. Admin password is now reset to your chosen password.",
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Request a password reset for user_john. You receive a reset token. The /reset-password endpoint accepts a "targetUserId" field.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Your token is valid for user_john. What if you keep the same valid token but change targetUserId to "admin_cloudbase"?',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /auth/reset-password with { "token": "<your_token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" }',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'After resetting admin password, login via /auth/login as admin_cloudbase with your new password to get the flag.',
    },
  ],
  flagAnswer: 'FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
  initialState: {
    users: [
      {
        username: 'user_john',
        password: 'john123',
        role: 'user',
        email: 'john@cloudbase.io',
      },
      {
        username: 'admin_cloudbase',
        password: 'ADM1N_CL0UD_S3CR3T!',
        role: 'admin',
        email: 'admin@cloudbase.io',
      },
    ],
  },
};
