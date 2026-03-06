// src/modules/practice-labs/jwt/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab2Metadata: LabMetadata = {
  slug: 'jwt-weak-secret-crack',
  title: 'JWT: Weak Secret Brute Force Attack',
  ar_title: 'JWT: هجوم القوة الغاشمة على السر الضعيف',
  description:
    'Crack a weak HMAC secret used to sign JWT tokens through offline brute-force attack, then forge an admin token to access premium course content.',
  ar_description:
    'اكسر سراً ضعيفاً لـ HMAC المستخدَم لتوقيع توكنات JWT من خلال هجوم قوة غاشمة offline، ثم زوّر توكن مسؤول للوصول إلى محتوى الدورات المتميزة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'JWT Security',
    'Cryptographic Attacks',
    'Brute Force',
    'HMAC Weakness',
  ],
  xpReward: 230,
  pointsReward: 115,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Crack the weak JWT signing secret (hint: it's in rockyou.txt top 1000), forge an admin token, and access the /premium/courses endpoint to retrieve the flag from the executive cybersecurity course.",
  ar_goal:
    'اكسر سر توقيع JWT الضعيف (تلميح: موجود في أعلى 1000 كلمة بـ rockyou.txt)، زوّر توكن مسؤول، وصل إلى /premium/courses لاسترجاع العلم من دورة الأمن السيبراني التنفيذية.',

  briefing: {
    en: `EduLearn Platform — online cybersecurity education for thousands of students.
You're student_john. You have access to free courses only.
Premium courses require an "admin" or "instructor" role.
Your JWT has: { "role": "student" }. Signed with HS256.
HS256 means the same secret is used for both signing and verification.
The signature is deterministic — if you know the secret, you can create any token.
The secret is a string. Someone chose it.
People tend to choose bad secrets.
The platform config file was once found in a public git repo (since deleted).
It showed: const secret = 'secret123';
Maybe they changed it. Maybe they didn't.
There's one way to find out.`,
    ar: `EduLearn Platform — تعليم الأمن السيبراني الإلكتروني لآلاف الطلاب.
أنت student_john. لديك وصول للدورات المجانية فقط.
الدورات المتميزة تتطلب دور "admin" أو "instructor".
JWT الخاص بك: { "role": "student" }. موقَّع بـ HS256.
HS256 يعني أن نفس السر يُستخدَم لكل من التوقيع والتحقق.
التوقيع حتمي — إن عرفت السر، يمكنك إنشاء أي توكن.
السر هو سلسلة نصية. اختارها شخص ما.
الناس تميل لاختيار أسرار سيئة.
ملف إعدادات المنصة وُجد مرة في مستودع git عام (محذوف منذ ذلك الحين).
أظهر: const secret = 'secret123';
ربما غيّروه. ربما لم يفعلوا.
هناك طريقة واحدة للتأكد.`,
  },

  stepsOverview: {
    en: [
      'Log in and capture your JWT token',
      'Identify the signing algorithm from the token header (HS256)',
      'Understand why HS256 allows offline brute-force attacks',
      "Use jwt_tool or the lab's /crack endpoint to brute-force the secret against a wordlist",
      'Use the discovered secret to sign a new token with role: "admin"',
      'Access /premium/courses with the forged token',
    ],
    ar: [
      'سجّل الدخول والتقط توكن JWT الخاص بك',
      'حدد خوارزمية التوقيع من header التوكن (HS256)',
      'افهم لماذا تسمح HS256 بهجمات القوة الغاشمة offline',
      'استخدم jwt_tool أو نقطة /crack الخاصة بالمختبر لكسر السر من wordlist',
      'استخدم السر المكتشَف لتوقيع توكن جديد بـ role: "admin"',
      'صل إلى /premium/courses بالتوكن المزوَّر',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'EduLearn uses HS256 JWT with a weak secret "secret123" — a common password found in the top 100 entries of rockyou.txt. Since HS256 is a symmetric algorithm, any party who knows the secret can forge valid tokens. Offline brute-force is possible because signature verification is a local computation.',
    vulnerableCode:
      '// Backend JWT signing (vulnerable):\n' +
      "const secret = 'secret123'; // ❌ Weak, commonly used secret\n" +
      "const token = jwt.sign({ userId, role }, secret, { algorithm: 'HS256' });",
    exploitation:
      '1. Capture JWT token from login response.\n' +
      '2. Crack offline: python3 jwt_tool.py <token> -C -d rockyou.txt — finds "secret123".\n' +
      '3. Forge: jwt.sign({ "username": "student_john", "role": "admin" }, "secret123", { algorithm: "HS256" }).\n' +
      '4. GET /premium/courses with forged token → flag in response.',
    steps: {
      en: [
        'POST /auth/login { "username": "student_john", "password": "johnpass" } → JWT token in response',
        'Inspect token header at jwt.io → { "alg": "HS256", "typ": "JWT" }',
        'POST /jwt/crack { "token": "<your_token>" } → lab simulates brute force → secret revealed: "secret123"',
        'Forge new token: header {"alg":"HS256","typ":"JWT"}, payload {"username":"student_john","role":"admin"}, signed with "secret123"',
        'GET /premium/courses with Authorization: Bearer <forged_token> → flag in premium course content',
      ],
      ar: [
        'POST /auth/login { "username": "student_john", "password": "johnpass" } → توكن JWT في الاستجابة',
        'افحص header التوكن على jwt.io → { "alg": "HS256", "typ": "JWT" }',
        'POST /jwt/crack { "token": "<your_token>" } → يحاكي المختبر القوة الغاشمة → يُكشَف السر: "secret123"',
        'زوّر توكناً جديداً: header {"alg":"HS256","typ":"JWT"}، payload {"username":"student_john","role":"admin"}، موقَّع بـ "secret123"',
        'GET /premium/courses مع Authorization: Bearer <forged_token> → العلم في محتوى الدورة المتميزة',
      ],
    },
    fix: [
      'Use cryptographically secure random secrets: crypto.randomBytes(64).toString("hex")',
      'Secret must be at least 256 bits (32 bytes) long — short or common passwords are crackable in seconds',
      'Store secrets in environment variables, never hardcoded in source code',
      'Consider switching to RS256 (asymmetric) so the private key never needs to be shared',
    ],
  },

  postSolve: {
    explanation: {
      en: 'HS256 JWT brute-forcing is possible because HMAC signature verification is a pure local computation — no network calls, no server queries. An attacker with a valid token can try thousands of candidate secrets per second offline. Weak or dictionary passwords can be cracked in seconds with tools like hashcat, jwt_tool, or john the ripper.',
      ar: 'كسر توكنات JWT بـ HS256 ممكن لأن التحقق من توقيع HMAC هو حساب محلي بحت — لا استدعاءات شبكة، لا استعلامات خادم. يمكن للمهاجم الذي لديه توكن صالح تجربة آلاف الأسرار المرشحة في الثانية offline. يمكن كسر كلمات المرور الضعيفة أو القاموسية في ثوانٍ باستخدام أدوات مثل hashcat وjwt_tool وjohn the ripper.',
    },
    impact: {
      en: 'Complete token forgery. Once the secret is discovered, the attacker can create valid tokens for any user with any role — permanent privilege escalation until the secret is rotated. All sessions are compromised retroactively.',
      ar: 'تزوير توكن كامل. بمجرد اكتشاف السر، يمكن للمهاجم إنشاء توكنات صالحة لأي مستخدم بأي دور — تصعيد صلاحيات دائم حتى يُدار السر. جميع الجلسات تُختَرَق بأثر رجعي.',
    },
    fix: [
      'Strong secret: minimum 64 random bytes from a CSPRNG — never dictionary words',
      'Secret rotation: rotate JWT secrets on a schedule and on any suspected exposure',
      'RS256 preferred for production: private key signs, public key verifies — cracking the public key is computationally infeasible',
      'Rate limit login endpoints to slow online brute force (separate from offline cracking)',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Your token uses HS256 (HMAC). The same secret signs AND verifies. If the secret is a weak word, it can be brute-forced offline without making any server requests.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        "Use the lab's built-in crack endpoint: POST /jwt/crack with your token. It runs a dictionary attack against common passwords and rockyou.txt top entries.",
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'The secret is a very common password — in the top 10 of most password lists. Once you have it, use jwt.io to craft a new token with role: "admin" signed with that secret.',
    },
  ],

  flagAnswer: 'FLAG{JWT_WEAK_SECRET_CRACKED_HS256_ADMIN}',
  initialState: {
    users: [
      { username: 'student_john', password: 'johnpass', role: 'student' },
      {
        username: 'instructor_admin',
        password: 'ADM1N_T34CH3R!',
        role: 'admin',
      },
    ],
    contents: [
      {
        title: 'Introduction to Cybersecurity',
        body: 'Free course — basics of security',
        author: 'free',
        isPublic: true,
      },
      {
        title: 'Advanced Penetration Testing',
        body: JSON.stringify({
          title: 'Executive Pentest Masterclass',
          description:
            'Premium content — FLAG{JWT_WEAK_SECRET_CRACKED_HS256_ADMIN}',
          modules: 12,
          duration: '40 hours',
        }),
        author: 'premium',
        isPublic: false,
      },
    ],
  },
};
