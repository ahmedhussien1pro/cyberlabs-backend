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
  goal: "The doctor's password reset link is: /reset-password?token=<SECRET>. The reset page loads an external analytics script. Intercept the token leaked via the Referer header to the external server, then use it to reset the doctor's password.",
  scenario: {
    context:
      'MediCare patient portal sends password reset links as GET URLs: /reset-password?token=abc123. The reset page HTML includes a third-party analytics script <script src="https://analytics.thirdparty.io/track.js">. When this script loads, the browser sends the full page URL (including the token) in the Referer header to the analytics server — leaking the secret reset token to a third party.',
    vulnerableCode: `// Password reset email sends:
// https://medicare.io/reset-password?token=RESET_TOKEN_HERE
// ❌ Token in URL = leaks in Referer, browser history, server logs

// Reset page HTML (vulnerable):
<html>
  <!-- ❌ Third-party script receives full URL including token in Referer! -->
  <script src="https://analytics.thirdparty.io/track.js"></script>
  <form action="/auth/do-reset" method="POST">
    <input type="hidden" name="token" value="{{ token }}" />
  </form>
</html>`,
    exploitation:
      "1. Trigger password reset for doctor@medicare.io. 2. The reset link contains the token in the URL. 3. Simulate visiting the reset page — the page loads external script. 4. The analytics server logs the Referer (full URL with token). 5. Extract token from simulated Referer log. 6. Use token to reset doctor's password.",
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Trigger a password reset for doctor@medicare.io via /auth/request-reset. Check the format of the reset link you receive.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'The reset link is a GET URL with ?token=... When a browser loads this page and makes ANY external request, the full URL (with token) appears in Referer.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use /auth/simulate-page-visit to simulate the victim visiting the reset page. Check /analytics/logs — the Referer header leaked the full URL including the token.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Extract the token from /analytics/logs, then POST /auth/do-reset with { "token": "<leaked_token>", "newPassword": "hacked!" }.',
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
