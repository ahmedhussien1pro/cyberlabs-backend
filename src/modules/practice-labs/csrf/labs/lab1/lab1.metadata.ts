// src/modules/practice-labs/csrf/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const csrfLab1Metadata: LabMetadata = {
  slug: 'csrf-basic-email-hijack-social',
  title: 'CSRF: Basic Email Hijack — Social Media Account Takeover',
  ar_title:
    'CSRF: اختطاف البريد الإلكتروني الأساسي — الاستيلاء على حساب التواصل الاجتماعي',
  description:
    "Exploit a basic CSRF vulnerability on a social media platform where the email change endpoint has no CSRF token protection. Craft a malicious HTML form that silently changes the victim's email when visited.",
  ar_description:
    'استغل ثغرة CSRF أساسية في منصة تواصل اجتماعي حيث لا يوجد حماية CSRF token في endpoint تغيير الإيميل. أنشئ نموذج HTML خبيث يغير إيميل الضحية بصمت عند زيارته.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'CSRF',
    'Session Riding',
    'HTML Form Exploitation',
    'Account Takeover',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "Craft a CSRF attack that changes the victim's account email to attacker@evil.com by submitting a forged form request to /account/change-email. The victim is already logged in.",
  scenario: {
    context:
      'ConnectHub is a social media platform. The /account/change-email endpoint accepts POST requests with only the new email in the body. No CSRF token is required, no Referer check is performed, and cookies are sent automatically by the browser. Any malicious page can trigger this action on behalf of a logged-in user.',
    vulnerableCode: `// Email change endpoint (vulnerable):
app.post('/account/change-email', isAuthenticated, async (req, res) => {
  const { newEmail } = req.body;
  // ❌ No CSRF token check
  // ❌ No Referer/Origin validation
  await db.users.update({ id: req.user.id, email: newEmail });
  res.json({ success: true, message: 'Email updated' });
});`,
    exploitation:
      'Create an HTML page with a form that auto-submits to /account/change-email with newEmail: attacker@evil.com. When the logged-in victim visits this page, their email changes silently — giving the attacker password reset control.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try changing your own email via POST /account/change-email. Notice there is no CSRF token in the request. What does this mean?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'A CSRF attack needs: 1) A state-changing action, 2) Cookie-based auth, 3) No CSRF token. All 3 conditions exist here.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'Use the built-in /csrf/simulate-victim endpoint to simulate a victim clicking your malicious link. POST /account/change-email with { "newEmail": "attacker@evil.com" }.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'Call POST /account/change-email directly with newEmail: "attacker@evil.com" as a cross-origin request (no Origin validation). The server accepts it and changes the email.',
    },
  ],
  flagAnswer: 'FLAG{CSRF_BASIC_EMAIL_HIJACK_NO_TOKEN_SOCIAL}',
  initialState: {
    users: [
      {
        username: 'victim_alice',
        password: 'alice123',
        role: 'user',
        email: 'alice@connecthub.io',
      },
      {
        username: 'attacker_bob',
        password: 'bob123',
        role: 'user',
        email: 'bob@connecthub.io',
      },
    ],
  },
};
