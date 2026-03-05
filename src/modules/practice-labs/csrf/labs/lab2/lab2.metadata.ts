// src/modules/practice-labs/csrf/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const csrfLab2Metadata: LabMetadata = {
  slug: 'csrf-json-api-fund-transfer-fintech',
  title: 'CSRF: JSON API Attack — Silent Fund Transfer in Fintech App',
  ar_title: 'CSRF: هجوم JSON API — تحويل أموال صامت في تطبيق مالي',
  description:
    'Exploit a CSRF vulnerability on a JSON-based API endpoint in a fintech app. The server accepts application/x-www-form-urlencoded as a fallback for JSON, allowing a classic HTML form CSRF attack to trigger money transfers.',
  ar_description:
    'استغل ثغرة CSRF في endpoint API يعتمد على JSON في تطبيق مالي. يقبل الخادم application/x-www-form-urlencoded كبديل لـ JSON، مما يسمح لهجوم HTML form الكلاسيكي بتشغيل تحويلات الأموال.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'CSRF',
    'JSON API Security',
    'Content-Type Bypass',
    'Financial Attack',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "Exploit the JSON transfer endpoint by sending a CSRF request using form-encoded content type. Transfer $500 from the victim's account to the attacker's account (ATTACKER-ACC) without the victim's knowledge.",
  scenario: {
    context:
      'PaySwift is a fintech payment platform. The /transfer endpoint expects JSON (application/json). Developers added a fallback: if the body is form-encoded, it\'s automatically parsed as JSON too. This means a plain HTML form (which always sends form-encoded) can trigger the JSON endpoint — bypassing the "JSON-only" assumption that developers thought protected them from CSRF.',
    vulnerableCode: `// Transfer endpoint (vulnerable):
app.post('/transfer', isAuthenticated, async (req, res) => {
  // ❌ Accepts both JSON and form-encoded (Content-Type bypass)
  const { toAccount, amount } = req.body;
  // ❌ No CSRF token check
  await db.transfers.create({ from: req.user.id, to: toAccount, amount });
  res.json({ success: true });
});`,
    exploitation:
      'Create an HTML form with action="/transfer" and hidden inputs for toAccount and amount. When the victim visits, the browser auto-submits with their session cookie. The server parses form-encoded body as JSON and processes the transfer.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The transfer endpoint says it\'s "JSON only". But what Content-Type does an HTML form submit? Try sending a form-encoded request to the JSON endpoint.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'POST /transfer with Content-Type: application/x-www-form-urlencoded and body: toAccount=ATTACKER-ACC&amount=500. Does the server accept it?',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        "Use /csrf/simulate-victim to trigger the attack. Include toAccount and amount in your request. The victim's session processes the transfer.",
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'POST /transfer directly with form-encoded body (no Content-Type: application/json). The server fallback parser processes it as JSON. Transfer completes. Check /wallet/balance for the flag.',
    },
  ],
  flagAnswer: 'FLAG{CSRF_JSON_API_CONTENT_TYPE_BYPASS_FUND_TRANSFER}',
  initialState: {
    users: [
      {
        username: 'victim_charlie',
        password: 'charlie123',
        role: 'user',
        email: 'charlie@payswift.io',
      },
      {
        username: 'attacker_dave',
        password: 'dave123',
        role: 'user',
        email: 'dave@payswift.io',
      },
    ],
    banks: [
      { accountNo: 'VICTIM-ACC', balance: 1000, ownerName: 'Charlie (Victim)' },
      { accountNo: 'ATTACKER-ACC', balance: 50, ownerName: 'Dave (Attacker)' },
    ],
  },
};
