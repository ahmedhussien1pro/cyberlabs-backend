// src/modules/practice-labs/jwt/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const jwtLab4Metadata: LabMetadata = {
  slug: 'jwt-kid-path-traversal',
  title: 'JWT: Key ID (kid) Header Injection — Path Traversal',
  ar_title: 'JWT: حقن معرّف المفتاح (kid) — اجتياز المسار',
  description:
    'Exploit a JWT key ID (kid) parameter injection vulnerability to perform path traversal, forcing the backend to use a predictable file (/dev/null) as the signing key to forge admin tokens.',
  ar_description:
    'استغل ثغرة حقن معامل معرّف المفتاح (kid) في JWT لتنفيذ اجتياز المسار، مما يُجبر الـ backend على استخدام ملف متوقع (/dev/null) كمفتاح التوقيع لتزوير توكنات المسؤول.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'JWT kid Injection',
    'Path Traversal',
    'File System Exploitation',
    'Advanced Token Forgery',
  ],
  xpReward: 310,
  pointsReward: 155,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Inject a malicious "kid" header pointing to a predictable file (/dev/null or a known static file), sign a forged admin JWT using that file\'s content as the key, and access /admin/users to retrieve the flag.',
  ar_goal:
    'احقن kid header خبيثاً يشير إلى ملف متوقع (/dev/null أو ملف ثابت معروف)، وقّع JWT مسؤول مزوَّر باستخدام محتوى ذلك الملف كمفتاح، وصل إلى /admin/users لاسترجاع العلم.',

  briefing: {
    en: `CloudVault SaaS — enterprise cloud storage and services.
You're user_bob. Your JWT has a "kid" field in the header.
kid = "key-2026-primary"
The "kid" (Key ID) field tells the backend which key to use for verification.
Useful for key rotation — different keys for different token versions.
The backend loads the key from disk: /keys/{kid}.pem
It reads whatever file that path points to.
/keys/key-2026-primary.pem → your legitimate key.
But what if you change kid to "../../../../dev/null"?
/dev/null is an empty file on every Unix system.
If the key file is empty, the HMAC secret is an empty string.
If the secret is an empty string, you know it.
You can sign anything.`,
    ar: `CloudVault SaaS — تخزين سحابي وخدمات مؤسسية.
أنت user_bob. JWT الخاص بك يحتوي على حقل "kid" في الـ header.
kid = "key-2026-primary"
حقل "kid" (معرّف المفتاح) يخبر الـ backend بأي مفتاح يستخدم للتحقق.
مفيد لتدوير المفاتيح — مفاتيح مختلفة لإصدارات توكن مختلفة.
يحمّل الـ backend المفتاح من القرص: /keys/{kid}.pem
يقرأ أي ملف يشير إليه هذا المسار.
/keys/key-2026-primary.pem → مفتاحك الشرعي.
لكن ماذا لو غيّرت kid إلى "../../../../dev/null"؟
/dev/null ملف فارغ على كل نظام Unix.
إن كان ملف المفتاح فارغاً، يصبح سر HMAC سلسلة فارغة.
إن كان السر سلسلة فارغة، أنت تعرفه.
يمكنك توقيع أي شيء.`,
  },

  stepsOverview: {
    en: [
      'Decode your JWT and inspect the "kid" field in the header',
      'Understand how the backend uses "kid" to load a key file from the filesystem',
      'Identify the path traversal vulnerability — no input sanitization on the kid value',
      'Craft a kid value that traverses out of the /keys/ directory to /dev/null',
      'Sign a forged admin token using an empty string as the HMAC secret',
      'Access /admin/users with the forged token',
    ],
    ar: [
      'فكّ ترميز JWT الخاص بك وافحص حقل "kid" في الـ header',
      'افهم كيف يستخدم الـ backend "kid" لتحميل ملف مفتاح من نظام الملفات',
      'حدد ثغرة اجتياز المسار — لا تعقيم لقيمة kid',
      'صمّم قيمة kid تتجاوز دليل /keys/ وصولاً إلى /dev/null',
      'وقّع توكن مسؤول مزوَّر باستخدام سلسلة فارغة كسر HMAC',
      'صل إلى /admin/users بالتوكن المزوَّر',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'CloudVault backend loads the JWT signing key from disk using the "kid" header value directly: path.join("/keys", kid + ".pem"). No sanitization means path traversal is possible. By pointing kid to /dev/null (empty file), the HMAC secret becomes an empty string — a known, predictable value the attacker can use to sign any token.',
    vulnerableCode:
      '// Backend key loading (vulnerable):\n' +
      'const kid = decoded.header.kid;\n' +
      "const keyPath = path.join('/keys', kid + '.pem');\n" +
      '// ❌ No sanitization — allows ../../../etc/passwd\n' +
      "const key = fs.readFileSync(keyPath, 'utf8');\n" +
      "jwt.verify(token, key, { algorithms: ['HS256'] });",
    exploitation:
      '1. Build header: {"alg":"HS256","typ":"JWT","kid":"../../../../dev/null"}.\n' +
      '2. Backend resolves: /keys/../../../../dev/null.pem → /dev/null → reads empty string.\n' +
      '3. Sign JWT payload {"username":"user_bob","role":"admin"} with empty string secret.\n' +
      '4. GET /admin/users with forged token → flag in admin config.',
    steps: {
      en: [
        'Log in as user_bob → decode JWT → see: { "alg": "HS256", "kid": "key-2026-primary" }',
        'Understand the key loading: /keys/key-2026-primary.pem. The kid value is unsanitized.',
        'Craft traversal: kid = "../../../../dev/null" → backend resolves to /dev/null → empty content',
        'Sign: jwt.sign({ "username": "user_bob", "role": "admin" }, "", { algorithm: "HS256", header: { kid: "../../../../dev/null" } })',
        'GET /admin/users Authorization: Bearer <forged_token> → admin user list → flag in admin config body',
      ],
      ar: [
        'سجّل الدخول بوصفك user_bob → فكّ ترميز JWT → ترى: { "alg": "HS256", "kid": "key-2026-primary" }',
        'افهم تحميل المفتاح: /keys/key-2026-primary.pem. قيمة kid بدون تعقيم.',
        'صمّم الاجتياز: kid = "../../../../dev/null" → يحلّ الـ backend إلى /dev/null → محتوى فارغ',
        'وقّع: jwt.sign({ "username": "user_bob", "role": "admin" }, "", { algorithm: "HS256", header: { kid: "../../../../dev/null" } })',
        'GET /admin/users Authorization: Bearer <forged_token> → قائمة مستخدمي الأدمن → العلم في جسم admin config',
      ],
    },
    fix: [
      'Sanitize the kid header: reject values containing path separators (/, \\, ..) — use allowlist validation',
      'Use a key store/database instead of filesystem: look up keys by ID from DB, not file paths',
      'Validate that the resolved key path is within the /keys/ directory (path.resolve check)',
      'Use kid as a database primary key — never as a filesystem path segment',
    ],
  },

  postSolve: {
    explanation: {
      en: 'The JWT kid (Key ID) path traversal exploits the common pattern of using kid to load keys from a directory without sanitizing the value. By traversing to a predictable file with known contents (/dev/null = empty, /proc/sys/kernel/hostname = hostname, etc.), the attacker gains a known HMAC secret. This vulnerability combines JWT header injection with classic path traversal.',
      ar: 'يستغل اجتياز مسار kid (معرّف المفتاح) في JWT النمط الشائع لاستخدام kid لتحميل المفاتيح من دليل دون تعقيم القيمة. بالاجتياز إلى ملف متوقع بمحتوى معروف (/dev/null = فارغ، /proc/sys/kernel/hostname = اسم المضيف، إلخ)، يحصل المهاجم على سر HMAC معروف. تجمع هذه الثغرة بين حقن header JWT واجتياز المسار الكلاسيكي.',
    },
    impact: {
      en: 'Complete admin token forgery with zero knowledge of legitimate secrets. Depending on the target file used (hostname, static assets, environment values), the attacker can derive signing keys deterministically. In severe cases, kid SQL injection is also possible when kid is used to query a database.',
      ar: 'تزوير توكن مسؤول كامل بدون أي معرفة بالأسرار الشرعية. بحسب الملف المستهدَف المستخدَم (اسم المضيف، الأصول الثابتة، قيم البيئة)، يمكن للمهاجم اشتقاق مفاتيح التوقيع بشكل حتمي. في الحالات الشديدة، يكون حقن SQL عبر kid ممكناً أيضاً عندما يُستخدَم kid للاستعلام من قاعدة بيانات.',
    },
    fix: [
      'kid must be treated as an untrusted user input — never use it directly as a file path',
      'Allowlist-based key lookup: maintain a { kid: key } map in memory or DB, reject unknown kids',
      'Path traversal prevention: path.resolve(keyPath).startsWith("/keys/") before loading',
      'Test: inject kid = "../../../etc/passwd" — should return 400, not 200',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Decode your JWT header — notice the "kid" field. The backend uses this to load a key file from /keys/{kid}.pem. What if you change kid to include ../ directory traversal sequences?',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Try: kid = "../../../../dev/null". The backend resolves this to /dev/null — an empty file on all Unix systems. An empty key file means the HMAC secret is an empty string "".',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'Sign your forged token with an empty string as the secret: jwt.sign({ role: "admin" }, "", { algorithm: "HS256", header: { kid: "../../../../dev/null" } }). The backend reads the empty file and verifies successfully.',
    },
  ],

  flagAnswer: 'FLAG{JWT_KID_PATH_TRAVERSAL_ADMIN_PWNED}',
  initialState: {
    users: [
      { username: 'user_bob', password: 'bobpass', role: 'user' },
      { username: 'sysadmin', password: 'SYS_4DM1N_R00T!', role: 'admin' },
    ],
    contents: [
      {
        title: 'Project Alpha',
        body: 'User-level project',
        author: 'user_bob',
        isPublic: false,
      },
      {
        title: 'Admin Config',
        body: JSON.stringify({
          secrets: ['FLAG{JWT_KID_PATH_TRAVERSAL_ADMIN_PWNED}'],
          apiKeys: ['admin-api-key-12345'],
        }),
        author: 'sysadmin',
        isPublic: false,
      },
    ],
  },
};
