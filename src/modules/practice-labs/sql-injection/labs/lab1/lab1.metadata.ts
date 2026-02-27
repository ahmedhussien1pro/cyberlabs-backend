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
  duration: 30, // minutes
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Access the administrator dashboard without knowing the password.',
  scenario: {
    context:
      'This environment simulates a legacy banking portal. The backend directly concatenates user input into the SQL query without parameterization or sanitization.',
    vulnerableCode:
      "SELECT * FROM users WHERE username = '$username' AND password = '$password'",
    exploitation:
      "Inject `' OR '1'='1` into the username field to make the WHERE clause always evaluate to true, bypassing authentication.",
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Think about how the backend builds the SQL query. It probably looks like: SELECT * FROM users WHERE username = '$input'",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "What happens if you inject a single quote (') into the username field? It breaks the query syntax.",
    },
    {
      order: 3,
      xpCost: 30,
      content:
        'Try to make the WHERE clause always evaluate to true. The OR operator is your friend.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        "Solution: Enter `admin' OR '1'='1` in the username field and leave the password blank.",
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
