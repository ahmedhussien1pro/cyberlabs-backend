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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "The government portal uses CSRF tokens but generates them as MD5(userId + date). Predict the victim's CSRF token, then use it to forge a request that changes the victim citizen's address and phone number.",
  ar_goal:
    'تستخدم البوابة الحكومية CSRF tokens لكنها تُولّدها كـ MD5(userId + date). تنبأ بـ CSRF token الضحية، ثم استخدمه لتزوير طلب يغير عنوان ورقم هاتف المواطن الضحية.',

  briefing: {
    en: `E-Gov — government citizen portal. National ID updates, address registration, document requests.
"Security audit passed. CSRF tokens implemented."
You look at your own CSRF token.
Request /csrf/get-my-token.
It comes back: a32f8b1c... 
32 characters. Hexadecimal. Looks strong.
You look at it again.
Your userId is CITIZEN-002.
Today is 2026-03-06.
You take CITIZEN-002 + 2026-03-06.
You run MD5.
a32f8b1c...
It matches.
The token is not random.
It's deterministic.
The victim is CITIZEN-001.
You know her userId.
You know today's date.
MD5(CITIZEN-001 + 2026-03-06).
You have her token.
Without ever seeing her session.`,
    ar: `E-Gov — بوابة المواطنين الحكومية. تحديثات الهوية الوطنية، تسجيل العنوان، طلبات الوثائق.
"اجتاز تدقيق الأمان. تم تطبيق CSRF tokens."
تنظر إلى CSRF token الخاص بك.
اطلب /csrf/get-my-token.
يعود: a32f8b1c...
32 حرفاً. هيكساديسيمال. يبدو قوياً.
تنظر إليه مرة أخرى.
userId الخاص بك هو CITIZEN-002.
اليوم هو 2026-03-06.
تأخذ CITIZEN-002 + 2026-03-06.
تُشغّل MD5.
a32f8b1c...
يتطابق.
التوكن ليس عشوائياً.
إنه حتمي.
الضحية هي CITIZEN-001.
تعرف userId الخاص بها.
تعرف تاريخ اليوم.
MD5(CITIZEN-001 + 2026-03-06).
لديك توكنها.
دون أن ترى جلستها قط.`,
  },

  stepsOverview: {
    en: [
      'GET /csrf/get-my-token — retrieve your own CSRF token, observe its format (32 hex chars = MD5)',
      'Reverse-engineer the token: try MD5(your_userId + today_date) — confirm it matches your token',
      'Algorithm confirmed: MD5(userId + YYYY-MM-DD)',
      'Calculate victim token: MD5("CITIZEN-001" + "2026-03-06")',
      'POST /profile/update { "csrfToken": "<predicted>", "targetCitizenId": "CITIZEN-001", "newAddress": "Attacker Street", "newPhone": "010-EVIL" }',
      'GET /citizens/CITIZEN-001 — confirm data changed → flag returned',
    ],
    ar: [
      'GET /csrf/get-my-token — استرجع CSRF token الخاص بك، لاحظ تنسيقه (32 حرف hex = MD5)',
      'اعكس هندسة التوكن: جرب MD5(userId الخاص بك + تاريخ اليوم) — أكّد أنه يتطابق مع توكنك',
      'تم تأكيد الخوارزمية: MD5(userId + YYYY-MM-DD)',
      'احسب توكن الضحية: MD5("CITIZEN-001" + "2026-03-06")',
      'POST /profile/update { "csrfToken": "<predicted>"، "targetCitizenId": "CITIZEN-001"، "newAddress": "Attacker Street"، "newPhone": "010-EVIL" }',
      'GET /citizens/CITIZEN-001 — أكّد تغيير البيانات → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "E-Gov CSRF token generation: MD5(userId + currentDate). Both inputs are predictable — userId is sequential (CITIZEN-001, CITIZEN-002...) and the date is public knowledge. The token is also valid for the entire day (not per-request), eliminating any timing advantage. An attacker who knows any victim's userId can pre-calculate their valid CSRF token for any given day.",
    vulnerableCode:
      '// CSRF token generation (vulnerable):\n' +
      'function generateCsrfToken(userId: string): string {\n' +
      '  const today = new Date().toISOString().split(\'T\')[0]; // "2026-03-06"\n' +
      '  // ❌ Predictable: based on public info (userId) + known date\n' +
      "  return crypto.createHash('md5').update(userId + today).digest('hex');\n" +
      '}\n\n' +
      '// Token validation:\n' +
      "app.post('/profile/update', (req, res) => {\n" +
      '  const expectedToken = generateCsrfToken(req.user.id);\n' +
      '  // ❌ Same formula is predictable by attacker\n' +
      "  if (req.body.csrfToken !== expectedToken) return res.status(403).json({ error: 'Invalid CSRF token' });\n" +
      '  // Processes update...\n' +
      '});',
    exploitation:
      '1. GET /csrf/get-my-token → "a32f8b1c4d..." for CITIZEN-002\n' +
      '2. Verify: MD5("CITIZEN-002" + "2026-03-06") = "a32f8b1c4d..."\n' +
      '3. Calculate: MD5("CITIZEN-001" + "2026-03-06") = victim\'s token\n' +
      '4. POST /profile/update { "csrfToken": "<calculated>", "targetCitizenId": "CITIZEN-001", "newAddress": "Attacker Street", "newPhone": "010-EVIL" }',
    steps: {
      en: [
        'GET /csrf/get-my-token → receive your token (CITIZEN-002 token)',
        'Use /csrf/predict-token { "targetUserId": "CITIZEN-001" } → lab calculates MD5("CITIZEN-001" + today) → predicted token',
        'POST /profile/update { "csrfToken": "<predicted_token>", "targetCitizenId": "CITIZEN-001", "newAddress": "Attacker Street 42", "newPhone": "010-EVIL-000" }',
        'GET /citizens/CITIZEN-001 → address: "Attacker Street 42" → flag: FLAG{CSRF_PREDICTABLE_MD5_TOKEN_BYPASS_GOVERNMENT_DATA}',
      ],
      ar: [
        'GET /csrf/get-my-token → استلم توكنك (توكن CITIZEN-002)',
        'استخدم /csrf/predict-token { "targetUserId": "CITIZEN-001" } → المختبر يحسب MD5("CITIZEN-001" + اليوم) → التوكن المتنبَّأ',
        'POST /profile/update { "csrfToken": "<predicted_token>"، "targetCitizenId": "CITIZEN-001"، "newAddress": "Attacker Street 42"، "newPhone": "010-EVIL-000" }',
        'GET /citizens/CITIZEN-001 → address: "Attacker Street 42" → العلم: FLAG{CSRF_PREDICTABLE_MD5_TOKEN_BYPASS_GOVERNMENT_DATA}',
      ],
    },
    fix: [
      'Cryptographically random tokens: CSRF tokens must be generated with a CSPRNG — crypto.randomBytes(32).toString("hex") — never deterministic',
      'Per-request tokens: a new token is generated for each form load and invalidated after use — not reused for an entire day',
      "Server-side storage: store the token server-side (in session) and validate against the stored value — don't regenerate from a formula",
      'MD5 for security is insufficient even if random: use SHA-256 minimum for security-sensitive tokens',
    ],
  },

  postSolve: {
    explanation: {
      en: "A CSRF token that exists but is predictable provides no security — it's security theater. The entire purpose of a CSRF token is to be an unpredictable secret that only the legitimate client and server share. If the token can be derived from public information (userId + date), any attacker who knows the victim's userId can forge valid tokens. This is a failure of the token's fundamental security property: unpredictability.",
      ar: 'CSRF token موجود لكن قابل للتنبؤ لا يوفر أي أمان — إنه مسرحية أمنية. الغرض الكامل من CSRF token هو أن يكون سراً غير قابل للتنبؤ يتشاركه فقط العميل الشرعي والخادم. إذا كان التوكن يمكن اشتقاقه من معلومات عامة (userId + date)، يمكن لأي مهاجم يعرف userId الضحية تزوير توكنات صالحة. هذا فشل في الخاصية الأمنية الأساسية للتوكن: عدم القدرة على التنبؤ.',
    },
    impact: {
      en: 'Government data manipulation: address, phone, and national ID data can be modified for any citizen. Consequences: misdirected government mail, fraudulent document requests, voter registration manipulation, tax record corruption. The "CSRF token exists" checkbox was checked — but the implementation was fundamentally broken.',
      ar: 'التلاعب بالبيانات الحكومية: يمكن تعديل العنوان والهاتف وبيانات الهوية الوطنية لأي مواطن. العواقب: إساءة توجيه البريد الحكومي، طلبات وثائق احتيالية، التلاعب بتسجيل الناخبين، فساد سجلات الضرائب. تم تحديد مربع "CSRF token موجود" — لكن التنفيذ كان معطوباً جوهرياً.',
    },
    fix: [
      'True randomness: crypto.randomBytes(32) — 256 bits of entropy, completely unpredictable',
      'Per-request lifecycle: generate on form render → store in session → validate on submit → invalidate immediately',
      'No formula-based generation: CSRF tokens must never be derived from any combination of known values',
      "Token binding: tie the token to the specific user's session, not just their userId — so even if the algorithm is known, session ID is the unknown variable",
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        "The portal uses CSRF tokens. Request /csrf/get-my-token to see your own token. It's 32 hex characters. What common hash function produces 32 hex characters? Can you reverse-engineer the input?",
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'Your token is MD5(userId + date). Try: MD5("CITIZEN-002" + "2026-03-06"). If it matches your token — the algorithm is confirmed. Now calculate it for CITIZEN-001.',
    },
    {
      order: 3,
      xpCost: 75,
      content:
        'Use /csrf/predict-token { "targetUserId": "CITIZEN-001" } to get the predicted token. Then POST /profile/update with that token and targetCitizenId: "CITIZEN-001" to forge the request.',
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
