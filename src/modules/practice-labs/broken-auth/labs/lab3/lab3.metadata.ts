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
    'استغل ثغرة مصادقة مكسورة في بوابة صحية حيث يتضمّن URL توكن إعادة تعيين كمعامل استعلام. يتسرّب عبر Referer header إلى خادم تحليلات خارجي.',
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
    objective: 'Intercept the password reset token for doctor@medicare.io by reading the Referer header logged by the analytics server, then use it to take over the doctor account.',
    ar_objective: 'التقط توكن إعادة تعيين كلمة مرور لـ doctor@medicare.io من خلال سجلات التحليلات، ثم استخدمه للاستيلاء على الحساب.',
    successCriteria: ['Login as doctor@medicare.io after resetting their password using the leaked token'],
    ar_successCriteria: ['سجّل الدخول كـ doctor@medicare.io بعد إعادة تعيين كلمة مرورهم باستخدام التوكن المسرَّب'],
  },

  labInfo: {
    vulnType: 'Broken Authentication — Reset Token URL Exposure via Referer',
    ar_vulnType: 'Broken Authentication — كشف توكن إعادة التعيين عبر Referer',
    cweId: 'CWE-598',
    cvssScore: 7.4,
    description: 'Password reset token is embedded in the URL as a query param. Third-party script on reset page causes browser to send full URL in Referer header, leaking the token.',
    ar_description: 'توكن إعادة التعيين مضمَّن في URL كمعامل استعلام. يتسرّب عبر Referer header لسكريبت خارجي.',
    whatYouLearn: [
      'Why putting secrets in URLs is fundamentally unsafe (Referer, browser history, server logs)',
      'How third-party scripts silently exfiltrate URL-embedded secrets via Referer header',
      'POST-redirect pattern: correct password reset flow design',
      'Mitigation: Referrer-Policy header + no external scripts on sensitive pages',
    ],
    ar_whatYouLearn: [
      'لماذا وضع الأسرار في URLs غير آمن جوهرياً',
      'كيف تسرّب السكريبتات الخارجية الأسرار عبر Referer',
      'نمط POST-redirect: تصميم تدفق إعادة تعيين صحيح',
      'التخفيف: Referrer-Policy + لا سكريبتات خارجية على صفحات حساسة',
    ],
    techStack: ['REST API', 'Node.js', 'HTTP Headers', 'Password Reset Flow'],
    references: [
      { label: 'OWASP Forgot Password Cheat Sheet', url: 'https://owasp.org/www-community/attacks/Forgot_Password_Cheat_Sheet' },
      { label: 'MDN Referrer-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy' },
      { label: 'CWE-598', url: 'https://cwe.mitre.org/data/definitions/598.html' },
    ],
  },

  goal: "The doctor's reset link is /reset-password?token=<SECRET>. The reset page loads an external analytics script. Intercept the token via the Referer header, then use it to reset the doctor's password.",
  ar_goal: 'رابط إعادة التعيين هو /reset-password?token=<SECRET>. تحمّل الصفحة سكريبت تحليلات خارجياً. التقط التوكن عبر Referer.',

  briefing: {
    en: 'MediCare reset link embeds token in URL. Reset page loads external analytics script. Browser sends full URL in Referer header of script request. Analytics server logs it. You can read those logs.',
    ar: 'MediCare يضمَّن توكن إعادة التعيين في URL. صفحة إعادة التعيين تحمّل سكريبت تحليلات خارجياً. المتصفح يرسل URL الكامل في Referer. تستطيع قراءة تلك السجلات.',
  },

  stepsOverview: {
    en: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" }',
      'POST /auth/simulate-page-visit — triggers analytics script with Referer',
      'GET /analytics/logs — find Referer with embedded token',
      'POST /auth/do-reset { "token": "<leaked>", "newPassword": "hacked!" }',
      'Login as doctor@medicare.io → flag',
    ],
    ar: [
      'POST /auth/request-reset { "email": "doctor@medicare.io" }',
      'POST /auth/simulate-page-visit — يشغّل طلب التحليلات مع Referer',
      'GET /analytics/logs — ابحث عن Referer مع التوكن',
      'POST /auth/do-reset { "token": "<leaked>"، "newPassword": "hacked!" }',
      'دخول كـ doctor@medicare.io → العلم',
    ],
  },

  solution: {
    context: 'MediCare embeds reset token in URL as query param. Reset page loads third-party analytics script which causes browser to send full URL in Referer header.',
    vulnerableCode:
      '// Reset email: https://medicare.io/reset-password?token=RESET_TOKEN\n' +
      '// \u274c Token in URL = leaks in Referer\n' +
      '<!-- \u274c Third-party script receives full URL in Referer! -->\n' +
      '<script src="https://analytics.thirdparty.io/track.js"></script>',
    exploitation:
      '1. POST /auth/request-reset\n2. POST /auth/simulate-page-visit\n3. GET /analytics/logs \u2192 token\n4. POST /auth/do-reset \u2192 login \u2192 flag',
    steps: {
      en: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" }',
        'POST /auth/simulate-page-visit',
        'GET /analytics/logs \u2192 { "referer": "https://medicare.io/reset-password?token=abc123" }',
        'POST /auth/do-reset { "token": "abc123", "newPassword": "h4cked123!" }',
        'POST /auth/login { "email": "doctor@medicare.io", "password": "h4cked123!" } \u2192 FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
      ar: [
        'POST /auth/request-reset { "email": "doctor@medicare.io" }',
        'POST /auth/simulate-page-visit',
        'GET /analytics/logs \u2192 { "referer": "...?token=abc123" }',
        'POST /auth/do-reset { "token": "abc123"\u060c "newPassword": "h4cked123!" }',
        'POST /auth/login \u2192 FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
      ],
    },
    fix: [
      'Tokens in POST body only: never in URLs',
      'Referrer-Policy: no-referrer on reset pages',
      'No external scripts on sensitive pages',
      'Short token validity: 15-30 minutes',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Browsers automatically include the full URL in Referer header of any outgoing request. Putting a secret token in URL is fundamentally unsafe.',
      ar: 'تُضمّن المتصفحات تلقائياً URL الكامل في Referer. وضع توكن سري في URL غير آمن.',
    },
    impact: {
      en: 'Healthcare account takeover: patient medical records, prescriptions, personal health data under HIPAA/GDPR.',
      ar: 'استيلاء على حساب صحي: سجلات طبية، وصفات، بيانات محمية بـ HIPAA/GDPR.',
    },
    fix: [
      'POST-redirect pattern: reset link \u2192 POST token in body',
      'Referrer-Policy: no-referrer',
      'No external resources on security-critical pages',
      'Short token validity',
    ],
  },

  hints: [
    { order: 1, xpCost: 15, ar_content: 'شغّل إعادة تعيين كلمة مرور عبر POST /auth/request-reset. تنسيق URL: /reset-password?token=<SECRET>.', content: 'Trigger reset via POST /auth/request-reset. Reset URL format: /reset-password?token=<SECRET>.' },
    { order: 2, xpCost: 30, ar_content: 'صفحة إعادة التعيين تحمّل سكريبت تحليلات. استدعِ /auth/simulate-page-visit.', content: 'Reset page loads external analytics script. Call /auth/simulate-page-visit to simulate the browser request.' },
    { order: 3, xpCost: 55, ar_content: 'GET /analytics/logs. ابحث عن Referer يحتوي URL إعادة التعيين مع التوكن.', content: 'GET /analytics/logs. Find Referer containing the full reset URL with the token.' },
    { order: 4, xpCost: 75, ar_content: 'POST /auth/do-reset { "token": "<extracted>"\u060c "newPassword": "hacked!" }. ثم سجّل الدخول.', content: 'POST /auth/do-reset { "token": "<extracted>", "newPassword": "hacked!" }. Then login as doctor.' },
  ],

  flagAnswer: 'FLAG{BROKEN_AUTH_RESET_TOKEN_URL_REFERER_LEAK_HEALTHCARE}',
  initialState: {
    users: [
      { username: 'doctor_hassan', password: 'Doc_H4ss4n_2024!', role: 'doctor', email: 'doctor@medicare.io' },
      { username: 'patient_sara', password: 'sara123', role: 'patient', email: 'sara@medicare.io' },
    ],
  },
};
