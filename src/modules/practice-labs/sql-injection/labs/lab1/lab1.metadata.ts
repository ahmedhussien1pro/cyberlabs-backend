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

  // ─── للمتدرب ────────────────────────────────────────────────────
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
      'Probe the login form — observe how the server responds to unexpected characters',
      'Understand the structure of the SQL query being built behind the scenes',
      'Craft an input that changes the logic of the query to always succeed',
    ],
    ar: [
      'استكشف نموذج تسجيل الدخول — لاحظ كيف يستجيب الخادم للأحرف غير المتوقعة',
      'افهم بنية استعلام SQL الذي يُبنى في الخلفية',
      'صمّم مدخلاً يغير منطق الاستعلام ليتحقق دائماً',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "Legacy banking portal backend directly concatenates user input into the SQL query without parameterization or sanitization. The query structure is: SELECT * FROM users WHERE username = '$input' AND password = '$pass'.",
    vulnerableCode:
      "SELECT * FROM users WHERE username = '$username' AND password = '$password'",
    exploitation:
      "Inject `' OR '1'='1` into the username field. This transforms the query to: WHERE username = '' OR '1'='1' AND password = '...', making the WHERE clause always true and returning the first user (admin).",
    steps: {
      en: [
        'Open the login page and observe the normal login behavior with valid credentials',
        "Test with a single quote (') in the username field — notice if an error or abnormal response occurs",
        "Enter `' OR '1'='1` in the username field and any value in the password field",
        "Submit — the query becomes: WHERE username = '' OR '1'='1' AND password = '...' → always true → logs in as admin",
        'Retrieve the flag from the admin dashboard',
      ],
      ar: [
        'افتح صفحة تسجيل الدخول ولاحظ السلوك الطبيعي باستخدام بيانات صحيحة',
        "اختبر بعلامة اقتباس مفردة (') في حقل اسم المستخدم — لاحظ إن كان هناك خطأ أو استجابة غير طبيعية",
        "أدخل `' OR '1'='1` في حقل اسم المستخدم وأي قيمة في حقل كلمة المرور",
        "أرسل — يصبح الاستعلام: WHERE username = '' OR '1'='1' AND password = '...' → صحيح دائماً → يسجل الدخول كأدمن",
        'احصل على العلم من لوحة تحكم المدير',
      ],
    },
    fix: [
      'Use parameterized queries: db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password])',
      'Use ORM: prisma.user.findFirst({ where: { username, password: hashedPassword } })',
      'Never concatenate user input directly into SQL strings',
      'Hash passwords using bcrypt — never store or compare plaintext',
    ],
  },

  // ─── بعد الحل ──────────────────────────────────────────────────
  postSolve: {
    explanation: {
      en: 'SQL Injection in authentication queries allows an attacker to manipulate the WHERE clause logic. By injecting OR 1=1, the condition always evaluates to true, granting access without valid credentials. This is one of the most classic and dangerous web vulnerabilities.',
      ar: 'حقن SQL في استعلامات المصادقة يسمح للمهاجم بالتلاعب في منطق جملة WHERE. بحقن OR 1=1، يُقيَّم الشرط دائماً بـ true، مما يمنح الوصول دون بيانات اعتماد صالحة. هذه من أكثر ثغرات الويب كلاسيكية وخطورة.',
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
        "Think about how the backend builds the SQL query. It probably looks like: SELECT * FROM users WHERE username = '$input' AND password = '$pass'",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "What happens if you inject a single quote (') into the username field? Does it break the query syntax?",
    },
    {
      order: 3,
      xpCost: 30,
      content:
        'Try to make the WHERE clause always evaluate to true. Think about SQL boolean operators — OR is your friend here.',
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
