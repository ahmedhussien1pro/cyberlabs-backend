// src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'sqli-auth-bypass',
  title: 'SQL Injection: Authentication Bypass',
  ar_title: 'حقن SQL: تجاوز المصادقة',
  description:
    'Bypass the login screen by exploiting a SQL injection vulnerability in the authentication query.',
  ar_description:
    'تجاوز شاشة تسجيل الدخول من خلال استغلال ثغرة SQL Injection في استعلام المصادقة.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['SQL Injection', 'Authentication Bypass', 'Payload Crafting'],
  xpReward: 100,
  pointsReward: 50,
  duration: 30,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Access the administrator dashboard without knowing the password.',
  ar_goal: 'ادخل لوحة تحكم المدير دون معرفة كلمة المرور.',

  briefing: {
    en: `SecureBank is a digital banking portal serving thousands of customers.
Their login page looks like any other — username and password, nothing special.
But something about the way the backend handles your input feels... off.
You noticed the response time changes slightly when you add certain characters.
The question is: does the system trust what you type a little too much?`,
    ar: `SecureBank هو بوابة بنكية رقمية تخدم آلاف العملاء.
صفحة تسجيل الدخول تبدو عادية — اسم مستخدم وكلمة مرور، لا شيء مميز.
لكن هناك شيء في طريقة معالجة الـ backend لمدخلاتك يبدو... مريباً.
لاحظت أن وقت الاستجابة يتغير قليلاً عند إضافة أحرف معينة.
السؤال هو: هل النظام يثق في ما تكتبه أكثر مما ينبغي؟`,
  },

  stepsOverview: {
    en: [
      'Probe — inject a special character to test if the input is sanitized',
      'Confirm — use a logical operator to manipulate the WHERE clause',
      'Exploit — craft the final payload to bypass authentication completely',
    ],
    ar: [
      'استكشاف — أدخل حرفاً خاصاً لاختبار ما إذا كان المدخل يُعقَّم',
      'تأكيد — استخدم عاملاً منطقياً للتلاعب في جملة WHERE',
      'استغلال — اصنع الـ payload النهائي لتجاوز المصادقة بالكامل',
    ],
  },

  solution: {
    context:
      "Legacy banking portal backend directly concatenates user input into the SQL query without parameterization or sanitization. The query structure is: SELECT * FROM users WHERE username = '$input' AND password = '$pass'.",
    vulnerableCode:
      "SELECT * FROM users WHERE username = '$username' AND password = '$password'",
    exploitation:
      "Inject `admin' OR '1'='1' --` into the username field. This transforms the query to: WHERE username = 'admin' OR '1'='1' -- AND password = '...', making the WHERE clause always true and returning the admin user.",
    steps: {
      en: [
        'Open the login page and observe the normal login behavior',
        "Test with a single quote (') in the username field — observe the error response",
        "Add a logical OR condition: admin' OR 'x'='y — observe different behavior",
        "Craft the final payload: admin' OR '1'='1' -- (the -- comments out the password check)",
        'Submit — you are now logged in as admin. Retrieve the flag.',
      ],
      ar: [
        'افتح صفحة تسجيل الدخول ولاحظ السلوك الطبيعي',
        "اختبر بعلامة اقتباس مفردة (') في حقل اسم المستخدم — لاحظ رسالة الخطأ",
        "أضف شرط OR منطقي: admin' OR 'x'='y — لاحظ الاستجابة المختلفة",
        "اصنع الـ payload النهائي: admin' OR '1'='1' -- (-- تُعلّق فحص كلمة المرور)",
        'أرسل — أنت الآن مسجل دخول كأدمن. احصل على العلم.',
      ],
    },
    fix: [
      'Use parameterized queries: db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password])',
      'Use ORM: prisma.user.findFirst({ where: { username, password: hashedPassword } })',
      'Never concatenate user input directly into SQL strings',
      'Hash passwords using bcrypt — never store or compare plaintext',
    ],
  },

  postSolve: {
    explanation: {
      en: 'SQL Injection in authentication queries allows an attacker to manipulate the WHERE clause logic. By injecting OR 1=1 --, the condition always evaluates to true and the password check is commented out, granting access without valid credentials.',
      ar: 'حقن SQL في استعلامات المصادقة يسمح للمهاجم بالتلاعب في منطق جملة WHERE. بحقن OR 1=1 --، يُقيَّم الشرط دائماً بـ true ويُعلَّق فحص كلمة المرور، مما يمنح الوصول دون بيانات اعتماد صالحة.',
    },
    impact: {
      en: 'Complete authentication bypass. Attacker gains admin access to the entire banking portal, exposing customer data, transaction history, and financial controls.',
      ar: 'تجاوز كامل للمصادقة. يحصل المهاجم على وصول المدير لكامل البوابة البنكية، مما يكشف بيانات العملاء وسجلات المعاملات والتحكمات المالية.',
    },
    fix: [
      'Always use parameterized queries or prepared statements',
      'Implement bcrypt password hashing',
      'Add rate limiting and lockout after failed attempts',
      'Use WAF rules to detect common SQLi patterns',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        `The backend builds the SQL query by directly inserting your input — no sanitization. The query looks like this:\n\nSELECT * FROM users WHERE username = '$your_input' AND password = '$your_pass'\n\nStart by breaking the syntax: type a single quote (') in the username field and observe the server response. A different response means the input is reflected into the query.`,
    },
    {
      order: 2,
      xpCost: 20,
      content:
        `The single quote breaks the SQL string. Now use this to inject a logical condition.\n\nTry this in the username field:\n  admin' OR 'x'='y\n\nThis turns the WHERE clause into:\n  WHERE username = 'admin' OR 'x'='y' AND password = '...'\n\nThe server should behave differently — you're now manipulating the query logic.`,
    },
    {
      order: 3,
      xpCost: 30,
      content:
        `You're one step away. The final payload needs to:\n1. Make the WHERE condition always TRUE\n2. Comment out the password check using --\n\nFinal payload to use in the username field:\n  admin' OR '1'='1' --\n\nThis transforms the query to:\n  WHERE username = 'admin' OR '1'='1' -- AND password = '...'\n  → Always TRUE → password check ignored → logged in as admin`,
    },
  ],

  flagAnswer: 'FLAG{SQLI_AUTH_BYPASS_SUCCESS}',
  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'user',
        password: 'userpass',
      },
      {
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        password: 'impossible_to_guess_pass_XYZ',
      },
    ],
  },
};
