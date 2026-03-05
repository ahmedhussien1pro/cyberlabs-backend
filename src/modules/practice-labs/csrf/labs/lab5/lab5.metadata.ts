// src/modules/practice-labs/csrf/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const csrfLab5Metadata: LabMetadata = {
  slug: 'csrf-token-bypass-predictable-government',
  title: 'CSRF: Token Bypass — Predictable CSRF Token in Government Portal',
  ar_title: 'CSRF: تجاوز التوكن — CSRF Token قابل للتنبؤ في البوابة الحكومية',
  description:
    "Exploit a CSRF vulnerability where the CSRF token exists but is fatally flawed: it is based on a predictable algorithm (MD5 of userId + date). Predict the token, then forge a cross-site request to update a citizen's national ID data.",
  ar_description:
    'استغل ثغرة CSRF حيث يوجد CSRF token لكنه معيب بشكل قاتل: يعتمد على خوارزمية قابلة للتنبؤ (MD5 لـ userId + التاريخ). تنبأ بالتوكن ثم قم بتزوير طلب عبر المواقع لتحديث بيانات الهوية الوطنية لمواطن.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'CSRF Token Bypass',
    'Predictable Token',
    'Cryptographic Weakness',
    'Government Portal Security',
  ],
  xpReward: 400,
  pointsReward: 200,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "The government portal uses CSRF tokens but generates them as MD5(userId + date). Predict the victim's CSRF token, then use it to forge a request that changes the victim citizen's address and phone number.",
  scenario: {
    context:
      "E-Gov is a government citizen portal. It implements CSRF tokens — seemingly secure. However, the token generation is: csrfToken = MD5(userId + currentDate). Since userId is sequential and the date is known, an attacker can predict any user's CSRF token. Additionally, the same token is valid for the entire day (not per-request), making it even easier to exploit.",
    vulnerableCode: `// CSRF token generation (vulnerable):
function generateCsrfToken(userId: string): string {
  const today = new Date().toISOString().split('T')[0]; // "2026-03-05"
  // ❌ Predictable: based on public info (userId) + known date
  return crypto.createHash('md5').update(userId + today).digest('hex');
}

// Token validation:
app.post('/profile/update', (req, res) => {
  const expectedToken = generateCsrfToken(req.user.id);
  // ❌ Same formula is predictable by attacker
  if (req.body.csrfToken !== expectedToken) return res.status(403).json({ error: 'Invalid CSRF token' });
  // Processes update...
});`,
    exploitation:
      "1. Know the victim's userId (it's sequential: CITIZEN-001). 2. Calculate MD5(CITIZEN-001 + today's date). 3. Use this predicted token in a CSRF request to /profile/update. 4. The server validates the token and processes the malicious update.",
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'The portal uses CSRF tokens. Request /csrf/get-my-token to see your own token. Can you understand how it was generated?',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        "Your token is MD5(userId + date). The victim's userId is CITIZEN-001 and today's date is in YYYY-MM-DD format. Calculate their token.",
    },
    {
      order: 3,
      xpCost: 75,
      content:
        'Use /csrf/predict-token endpoint with { "targetUserId": "CITIZEN-001" } to predict the victim\'s CSRF token.',
    },
    {
      order: 4,
      xpCost: 110,
      content:
        'POST /profile/update with { "csrfToken": "<predicted>", "targetCitizenId": "CITIZEN-001", "newAddress": "Attacker Street", "newPhone": "010-EVIL" }. The token validates and data changes.',
    },
  ],
  flagAnswer: 'FLAG{CSRF_PREDICTABLE_MD5_TOKEN_BYPASS_GOVERNMENT_DATA}',
  initialState: {
    users: [
      {
        username: 'citizen_fatma',
        password: 'fatma123',
        role: 'citizen',
        email: 'fatma@egov.eg',
      },
      {
        username: 'attacker_karim',
        password: 'karim123',
        role: 'citizen',
        email: 'karim@egov.eg',
      },
    ],
    contents: [
      {
        title: 'CITIZEN-001',
        body: JSON.stringify({
          citizenId: 'CITIZEN-001',
          fullName: 'Fatma Ali Hassan',
          nationalId: '29901011234567',
          address: '12 Tahrir Square, Cairo',
          phone: '010-1234-5678',
          email: 'fatma@egov.eg',
        }),
        author: 'citizen_profile',
        isPublic: false,
      },
    ],
  },
};
