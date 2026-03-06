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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Craft a CSRF attack that changes the victim's account email to attacker@evil.com by submitting a forged form request to /account/change-email. The victim is already logged in.",
  ar_goal:
    'أنشئ هجوم CSRF يغير إيميل حساب الضحية إلى attacker@evil.com عن طريق إرسال طلب نموذج مزوَّر إلى /account/change-email. الضحية مسجّلة الدخول بالفعل.',

  briefing: {
    en: `ConnectHub — a social media platform. 2 million users. Profile pages, posts, messages.
You are attacker_bob.
You want alice's account.
You don't have her password.
You don't need it.
Alice is logged in right now.
Her session cookie is in her browser.
The /account/change-email endpoint takes one thing: the new email.
No CSRF token. No Origin check. No Referer validation.
Just: POST { "newEmail": "whatever@you.want" }.
Her browser has her cookie.
Her browser will send it with any form — from any website.
Any website.
You control a website.
This is CSRF.`,
    ar: `ConnectHub — منصة تواصل اجتماعي. مليونا مستخدم. صفحات ملفات شخصية، منشورات، رسائل.
أنت attacker_bob.
تريد حساب alice.
ليس لديك كلمة مرورها.
لا تحتاجها.
Alice مسجّلة الدخول الآن.
كوكي جلستها في متصفحها.
يأخذ endpoint /account/change-email شيئاً واحداً: الإيميل الجديد.
لا CSRF token. لا فحص Origin. لا تحقق Referer.
فقط: POST { "newEmail": "whatever@you.want" }.
متصفحها لديه كوكيها.
متصفحها سيرسله مع أي نموذج — من أي موقع.
أي موقع.
أنت تتحكم في موقع.
هذا هو CSRF.`,
  },

  stepsOverview: {
    en: [
      'Understand the attack model: victim is logged in, browser auto-sends cookies with any cross-origin form submission',
      'Confirm no CSRF protection: POST /account/change-email — inspect request for csrf_token header or body field',
      'Craft the malicious payload: a form targeting /account/change-email with newEmail: attacker@evil.com',
      'Simulate victim visit via /csrf/simulate-victim — their session triggers the email change',
      "Confirm: GET /account/profile — alice's email is now attacker@evil.com → flag returned",
    ],
    ar: [
      'افهم نموذج الهجوم: الضحية مسجّلة الدخول، والمتصفح يرسل الكوكيز تلقائياً مع أي إرسال نموذج عبر الأصول',
      'أكّد غياب حماية CSRF: POST /account/change-email — افحص الطلب عن csrf_token في الهيدر أو الـ body',
      'أنشئ الـ payload الخبيث: نموذج يستهدف /account/change-email بـ newEmail: attacker@evil.com',
      'محاكاة زيارة الضحية عبر /csrf/simulate-victim — جلستها تُشغّل تغيير الإيميل',
      'تأكيد: GET /account/profile — إيميل alice الآن attacker@evil.com → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "ConnectHub /account/change-email accepts POST with only newEmail in the body. No CSRF token, no Origin/Referer validation. Browser cookies are sent automatically with any cross-origin POST form submission (unless SameSite=Strict is set — it is not). Any malicious website can change the logged-in victim's email.",
    vulnerableCode:
      "// Email change endpoint (vulnerable):\napp.post('/account/change-email', isAuthenticated, async (req, res) => {\n" +
      '  const { newEmail } = req.body;\n' +
      '  // ❌ No CSRF token check\n' +
      '  // ❌ No Referer/Origin validation\n' +
      '  await db.users.update({ id: req.user.id, email: newEmail });\n' +
      "  res.json({ success: true, message: 'Email updated' });\n" +
      '});',
    exploitation:
      'POST /csrf/simulate-victim with { "targetPath": "/account/change-email", "body": { "newEmail": "attacker@evil.com" } } — the backend simulates the victim\'s browser submitting the form with their active session. Email changes, attacker controls password reset.',
    steps: {
      en: [
        'POST /account/change-email { "newEmail": "test@test.com" } — confirm your own email changes, no CSRF token required',
        'POST /csrf/simulate-victim { "targetPath": "/account/change-email", "body": { "newEmail": "attacker@evil.com" } }',
        'GET /account/profile (as victim) → email: "attacker@evil.com" → CSRF succeeded',
        'Flag returned: FLAG{CSRF_BASIC_EMAIL_HIJACK_NO_TOKEN_SOCIAL}',
      ],
      ar: [
        'POST /account/change-email { "newEmail": "test@test.com" } — أكّد تغيير إيميلك الخاص، لا CSRF token مطلوب',
        'POST /csrf/simulate-victim { "targetPath": "/account/change-email"، "body": { "newEmail": "attacker@evil.com" } }',
        'GET /account/profile (كضحية) → email: "attacker@evil.com" → نجح CSRF',
        'العلم مُعاد: FLAG{CSRF_BASIC_EMAIL_HIJACK_NO_TOKEN_SOCIAL}',
      ],
    },
    fix: [
      'CSRF tokens: generate a cryptographically random, per-session (or per-request) token and validate it server-side on every state-changing request',
      'SameSite=Strict: set on session cookies — browser will NOT send cookies on any cross-site request',
      "Origin/Referer validation: reject requests where Origin or Referer doesn't match your domain",
      'Sensitive actions require re-authentication: email change should require current password confirmation',
    ],
  },

  postSolve: {
    explanation: {
      en: "CSRF (Cross-Site Request Forgery) exploits the browser's behavior of automatically including cookies with every request to a domain — regardless of which website triggered the request. The attack doesn't steal the cookie; it rides the session. The fundamental fix is to include a secret value (CSRF token) that the malicious site cannot know or read, because cross-origin reads are blocked by SOP (Same-Origin Policy) — but cross-origin writes (form submissions) are not.",
      ar: 'CSRF (تزوير الطلب عبر المواقع) يستغل سلوك المتصفح في تضمين الكوكيز تلقائياً مع كل طلب لنطاق — بصرف النظر عن أي موقع أطلق الطلب. الهجوم لا يسرق الكوكي؛ يركب الجلسة. الحل الأساسي هو تضمين قيمة سرية (CSRF token) لا يمكن للموقع الخبيث معرفتها أو قراءتها، لأن القراءات عبر الأصول محجوبة بواسطة SOP (سياسة نفس الأصل) — لكن الكتابات عبر الأصول (إرسال النماذج) ليست كذلك.',
    },
    impact: {
      en: 'After the email change, the attacker triggers "forgot password" for alice@connecthub.io — but the reset email goes to attacker@evil.com. Full account takeover. No brute force, no phishing interaction — a single page visit by the logged-in victim is sufficient.',
      ar: 'بعد تغيير الإيميل، يُشغّل المهاجم "نسيت كلمة المرور" لـ alice@connecthub.io — لكن بريد إعادة التعيين يذهب إلى attacker@evil.com. استيلاء كامل على الحساب. لا قوة غاشمة، لا تفاعل تصيد — زيارة صفحة واحدة من قِبَل الضحية المسجّلة الدخول كافية.',
    },
    fix: [
      'Synchronizer token pattern: server generates random token → embeds in form → validates on POST',
      "Double submit cookie: CSRF token set as cookie AND required in request body — cross-origin attacker can't read cookie to duplicate it",
      'SameSite=Strict: the simplest modern mitigation — browser refuses to send cookies on cross-site requests',
      'Critical actions: always require current password for email/password changes',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try changing your own email via POST /account/change-email. Notice there is no CSRF token in the request, no Origin check, nothing. What does this mean for cross-origin requests?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'A CSRF attack needs: 1) A state-changing action (email change ✓), 2) Cookie-based auth (✓), 3) No CSRF token (✓). All 3 conditions are met here.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'Use POST /csrf/simulate-victim to simulate the victim\'s browser submitting a forged form. Pass: { "targetPath": "/account/change-email", "body": { "newEmail": "attacker@evil.com" } }',
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
