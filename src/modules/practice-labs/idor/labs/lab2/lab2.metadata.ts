// src/modules/practice-labs/idor/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab2Metadata: LabMetadata = {
  slug: 'idor-api-key-management-devhub',
  canonicalConceptId: 'idor-sequential-id-enumeration',
  environmentType: 'GENERIC',
  title: 'IDOR: API Key Management — Steal Admin API Key',
  ar_title: 'IDOR: إدارة مفاتيح API — سرقة مفتاح API المسؤول',
  description:
    "Exploit IDOR in a developer platform where API keys are managed by numeric IDs. Enumerate key IDs to find and steal the admin's privileged API key granting full platform access.",
  ar_description:
    'استغل ثغرة IDOR في منصة المطورين حيث تُدار مفاتيح API بمعرفات رقمية. عدّد معرفات المفاتيح للعثور على مفتاح API المسؤول وسرقته للحصول على وصول كامل للمنصة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'API Security', 'Key Enumeration', 'Credential Theft'],
  xpReward: 230,
  pointsReward: 115,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  missionBrief: {
    codename: 'OPERATION MASTER KEY',
    classification: 'SECRET',
    objective: 'Infiltrate DevHub developer platform. Enumerate API key IDs to locate and extract the platform admin master key granting superuser access.',
    ar_objective: 'تسلل إلى منصة المطورين DevHub. عدّد معرفات مفاتيح API لتحديد واستخراج المفتاح الرئيسي للمسؤول الذي يمنح وصول superuser.',
    successCriteria: ['Retrieve the flag embedded in the admin master API key permissions array.'],
    ar_successCriteria: ['استرجع العلم المضمَّن في مصفوفة صلاحيات مفتاح API الرئيسي للمسؤول.'],
  },
  labInfo: {
    vulnType: 'IDOR (Insecure Direct Object Reference) — Credential Exposure',
    cweId: 'CWE-639',
    cvssScore: 8.1,
    description: 'API key management endpoints are high-value IDOR targets. Leaked keys grant persistent programmatic access that often does not expire.',
    ar_description: 'نقاط إدارة مفاتيح API هي أهداف IDOR عالية القيمة. المفاتيح المسرَّبة تمنح وصولاً برمجياً مستمراً غالباً لا ينتهي.',
    whatYouLearn: [
      'How IDOR in API key endpoints leads to full credential theft',
      'Why returning full secrets (keys, tokens) in GET responses is dangerous',
      'Enumeration amplification: finding admin resources via sequential IDs',
      'Mitigation: ownership checks + secret masking + UUID key IDs',
    ],
    ar_whatYouLearn: [
      'كيف يؤدي IDOR في نقاط نهاية مفاتيح API إلى سرقة بيانات اعتماد كاملة',
      'لماذا إعادة الأسرار الكاملة (المفاتيح، الرموز) في استجابات GET خطير',
      'تضخيم التعداد: إيجاد موارد المسؤول عبر المعرفات التسلسلية',
      'التخفيف: فحوصات الملكية + إخفاء الأسرار + معرفات المفاتيح UUID',
    ],
    techStack: ['REST API', 'Node.js', 'API Key Management', 'Sequential IDs'],
    references: [
      { label: 'OWASP API Security — BOLA', url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/' },
      { label: 'OWASP IDOR Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html' },
      { label: 'CWE-639', url: 'https://cwe.mitre.org/data/definitions/639.html' },
    ],
  },
  goal: "Your API key ID is KEY-201. Enumerate other key IDs to find the admin's master API key (KEY-2XX) and retrieve the flag embedded in its permissions.",
  ar_goal: 'معرف مفتاح API الخاص بك هو KEY-201. عدّد معرفات المفاتيح الأخرى للعثور على مفتاح API الرئيسي للمسؤول (KEY-2XX) واسترداد العلم المضمَّن في صلاحياته.',
  briefing: {
    en: `DevHub — a developer API platform. CI/CD integrations. Third-party connectors. Automation pipelines. You are dev_john. You just created an API key: KEY-201. Permissions: read:own, write:own. Basic tier. Makes sense. GET /api-keys/KEY-201 → your key, your secret, your permissions. Every key has a numeric ID. Sequential. Manageable. You change KEY-201 to KEY-202 in the request. dev_sara's key. Pro tier. More permissions. The server gave it to you. No questions asked. KEY-203. KEY-204. KEY-205. KEY-206. The admin must have a key somewhere. A master key. Platform:superuser. admin:full_access. Find it.`,
    ar: `DevHub — منصة API للمطورين. تكاملات CI/CD. موصلات طرف ثالث. خطوط أتمتة. أنت dev_john. أنشأت للتو مفتاح API: KEY-201. الصلاحيات: read:own، write:own. الطبقة الأساسية. منطقي. GET /api-keys/KEY-201 → مفتاحك، سرك، صلاحياتك. لكل مفتاح معرف رقمي. تسلسلي. قابل للإدارة. تغير KEY-201 إلى KEY-202 في الطلب. مفتاح dev_sara. الطبقة الاحترافية. صلاحيات أكثر. الخادم أعطاه لك. بدون أسئلة. KEY-203. KEY-204. KEY-205. KEY-206. الأدمن لا بد أن لديه مفتاحاً في مكان ما. مفتاح رئيسي. platform:superuser. admin:full_access. ابحث عنه.`,
  },
  stepsOverview: {
    en: [
      'GET /api-keys/KEY-201 — confirm your own key response structure',
      'GET /api-keys/KEY-202 — confirm no ownership check → IDOR confirmed',
      'Enumerate KEY-201 through KEY-210 sequentially',
      'Identify the key with MASTER tier and admin:full_access permissions',
      'Extract the flag from its permissions array',
    ],
    ar: [
      'GET /api-keys/KEY-201 — أكّد بنية استجابة مفتاحك الخاص',
      'GET /api-keys/KEY-202 — أكّد غياب فحص الملكية → تم تأكيد IDOR',
      'عدّد من KEY-201 إلى KEY-210 بشكل تسلسلي',
      'حدد المفتاح ذو الطبقة MASTER وصلاحيات admin:full_access',
      'استخرج العلم من مصفوفة الصلاحيات',
    ],
  },
  solution: {
    context: 'DevHub /api-keys/{keyId} endpoint returns full key details including the secret and permissions array for ANY authenticated user. No ownership check. KEY-207 is the platform admin master key with admin:full_access, platform:superuser permissions, and the flag embedded in the permissions array.',
    vulnerableCode:
      "// API Key endpoint (vulnerable):\napp.get('/api-keys/:keyId', authenticate, async (req, res) => {\n" +
      '  const apiKey = await db.apiKeys.findOne({ id: req.params.keyId });\n' +
      "  if (!apiKey) return res.status(404).json({ error: 'Key not found' });\n" +
      '  // ❌ Returns full key including secret — no ownership check!\n' +
      '  res.json({ keyId: apiKey.id, secret: apiKey.secret, permissions: apiKey.permissions });\n' +
      '});',
    exploitation:
      'GET /api-keys/KEY-207 → returns { "secret": "sk_master_ADMIN_9x8y7z6w5v4u3t2s1r", "permissions": ["admin:full_access", "platform:superuser", "flag:FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}"], "tier": "MASTER" }',
    steps: {
      en: [
        'GET /api-keys/KEY-201 → your key: { "secret": "sk_live_usr_abc123", "permissions": ["read:own", "write:own"], "tier": "basic" }',
        "GET /api-keys/KEY-202 → another user's key returned → IDOR confirmed",
        'Enumerate GET /api-keys/KEY-203 through KEY-207',
        'GET /api-keys/KEY-207 → MASTER tier, secret: "sk_master_ADMIN_9x8y7z6w5v4u3t2s1r", flag in permissions array',
      ],
      ar: [
        'GET /api-keys/KEY-201 → مفتاحك: { "secret": "sk_live_usr_abc123"، "permissions": ["read:own"، "write:own"]، "tier": "basic" }',
        'GET /api-keys/KEY-202 → مفتاح مستخدم آخر مُعاد → تم تأكيد IDOR',
        'عدّد GET /api-keys/KEY-203 إلى KEY-207',
        'GET /api-keys/KEY-207 → الطبقة MASTER، secret: "sk_master_ADMIN_9x8y7z6w5v4u3t2s1r"، العلم في مصفوفة الصلاحيات',
      ],
    },
    fix: [
      'Ownership check: if (apiKey.userId !== req.user.id) return 403 — no exceptions',
      'Never return API secrets in GET responses — use separate reveal endpoint with explicit user action',
      'Use UUIDs for key IDs: "key_f47ac10b58cc4372a5670e02b2c3d479" — unpredictable and non-enumerable',
      'Audit logs: log every /api-keys/{id} access — sequential enumeration creates an obvious pattern',
    ],
  },
  postSolve: {
    explanation: {
      en: "API key management endpoints are high-value IDOR targets because leaked keys grant persistent programmatic access — unlike session tokens, API keys often don't expire.",
      ar: 'نقاط إدارة مفاتيح API هي أهداف IDOR عالية القيمة لأن المفاتيح المسرَّبة تمنح وصولاً برمجياً مستمراً — على عكس رموز الجلسة، مفاتيح API غالباً لا تنتهي صلاحيتها.',
    },
    impact: {
      en: 'An attacker with the admin master API key has permanent programmatic full-access to the entire platform: all users, billing, configurations, and data. API key theft is silent — no login events, no session creation, no 2FA prompts.',
      ar: 'المهاجم الذي لديه مفتاح API الرئيسي للأدمن يمتلك وصولاً برمجياً دائماً وكاملاً للمنصة بأكملها. سرقة مفتاح API صامتة — لا أحداث تسجيل دخول، لا إنشاء جلسة، لا مطالبات 2FA.',
    },
    fix: [
      'Object-level auth: verify apiKey.userId === req.user.id before returning ANY key data',
      'Secret masking: return only the last 4 characters of the secret in list views',
      'UUIDs over sequential IDs: makes enumeration computationally infeasible',
      'Principle of least privilege: admin keys must be extra protected',
    ],
  },
  hints: [
    { order: 1, xpCost: 15, ar_content: 'مفتاح API الخاص بك هو KEY-201. الاستجابة تتضمن سر مفتاحك وصلاحياتك. ماذا لو طلبت KEY-202؟ هل يتحقق الخادم من المالك؟', content: 'Your API key is KEY-201. The response includes your key secret and permissions. What if you request KEY-202? Does the server check who owns it?' },
    { order: 2, xpCost: 30, ar_content: 'عدّد من KEY-201 إلى KEY-210. ابحث عن مفتاح بـ tier: "MASTER" أو صلاحيات تتضمن "admin:full_access".', content: 'Enumerate KEY-201 through KEY-210. Look for a key with tier: "MASTER" or permissions including "admin:full_access".' },
    { order: 3, xpCost: 50, ar_content: 'المفتاح الرئيسي للأدمن موجود بين KEY-205 وKEY-210. له حقل warning والعلم مضمَّن في مصفوفة الصلاحيات.', content: 'The admin master key is somewhere between KEY-205 and KEY-210. It has a warning field. The flag is embedded in the permissions array.' },
  ],
  flagAnswer: 'FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}',
  initialState: {
    contents: [
      { title: 'KEY-201', body: JSON.stringify({ secret: 'sk_live_usr_abc123', permissions: ['read:own', 'write:own'], tier: 'basic', owner: 'dev_john' }), author: 'apikey', isPublic: false },
      { title: 'KEY-202', body: JSON.stringify({ secret: 'sk_live_usr_def456', permissions: ['read:own', 'write:own', 'deploy:basic'], tier: 'pro', owner: 'dev_sara' }), author: 'apikey', isPublic: false },
      { title: 'KEY-203', body: JSON.stringify({ secret: 'sk_live_usr_ghi789', permissions: ['read:own'], tier: 'free', owner: 'dev_mike' }), author: 'apikey', isPublic: false },
      { title: 'KEY-204', body: JSON.stringify({ secret: 'sk_live_usr_jkl012', permissions: ['read:own', 'write:own', 'billing:manage'], tier: 'pro', owner: 'dev_ana' }), author: 'apikey', isPublic: false },
      { title: 'KEY-205', body: JSON.stringify({ secret: 'sk_live_usr_mno345', permissions: ['read:own', 'write:own'], tier: 'basic', owner: 'dev_omar' }), author: 'apikey', isPublic: false },
      { title: 'KEY-206', body: JSON.stringify({ secret: 'sk_live_usr_pqr678', permissions: ['read:own', 'write:own', 'team:manage'], tier: 'enterprise', owner: 'dev_lena' }), author: 'apikey', isPublic: false },
      { title: 'KEY-207', body: JSON.stringify({ secret: 'sk_master_ADMIN_9x8y7z6w5v4u3t2s1r', permissions: ['admin:full_access', 'platform:superuser', 'billing:all', 'users:manage', 'flag:FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}'], tier: 'MASTER', owner: 'platform_admin', warning: 'This key grants full platform control. Handle with extreme care.' }), author: 'admin_apikey', isPublic: false },
    ],
  },
};
