// src/modules/practice-labs/idor/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab2Metadata: LabMetadata = {
  slug: 'idor-api-key-management-devhub',
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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Your API key ID is KEY-201. Enumerate other key IDs to find the admin's master API key (KEY-2XX) and retrieve the flag embedded in its permissions.",
  ar_goal:
    'معرف مفتاح API الخاص بك هو KEY-201. عدّد معرفات المفاتيح الأخرى للعثور على مفتاح API الرئيسي للمسؤول (KEY-2XX) واسترداد العلم المضمَّن في صلاحياته.',

  briefing: {
    en: `DevHub — a developer API platform. CI/CD integrations. Third-party connectors. Automation pipelines.
You are dev_john. You just created an API key: KEY-201.
Permissions: read:own, write:own. Basic tier. Makes sense.
GET /api-keys/KEY-201 → your key, your secret, your permissions.
Every key has a numeric ID. Sequential. Manageable.
You change KEY-201 to KEY-202 in the request.
dev_sara's key. Pro tier. More permissions.
The server gave it to you.
No questions asked.
KEY-203. KEY-204. KEY-205. KEY-206.
The admin must have a key somewhere.
A master key.
Platform:superuser. admin:full_access.
Find it.`,
    ar: `DevHub — منصة API للمطورين. تكاملات CI/CD. موصلات طرف ثالث. خطوط أتمتة.
أنت dev_john. أنشأت للتو مفتاح API: KEY-201.
الصلاحيات: read:own، write:own. الطبقة الأساسية. منطقي.
GET /api-keys/KEY-201 → مفتاحك، سرك، صلاحياتك.
لكل مفتاح معرف رقمي. تسلسلي. قابل للإدارة.
تغير KEY-201 إلى KEY-202 في الطلب.
مفتاح dev_sara. الطبقة الاحترافية. صلاحيات أكثر.
الخادم أعطاه لك.
بدون أسئلة.
KEY-203. KEY-204. KEY-205. KEY-206.
الأدمن لا بد أن لديه مفتاحاً في مكان ما.
مفتاح رئيسي.
platform:superuser. admin:full_access.
ابحث عنه.`,
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

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'DevHub /api-keys/{keyId} endpoint returns full key details including the secret and permissions array for ANY authenticated user. No ownership check. KEY-207 is the platform admin master key with admin:full_access, platform:superuser permissions, and the flag embedded in the permissions array.',
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
      en: "API key management endpoints are high-value IDOR targets because leaked keys grant persistent programmatic access — unlike session tokens, API keys often don't expire. The vulnerability pattern is identical to other IDOR cases: a numeric ID in the URL with no ownership verification. But the impact is amplified because API keys enable automated, persistent access to the entire platform.",
      ar: 'نقاط إدارة مفاتيح API هي أهداف IDOR عالية القيمة لأن المفاتيح المسرَّبة تمنح وصولاً برمجياً مستمراً — على عكس رموز الجلسة، مفاتيح API غالباً لا تنتهي صلاحيتها. نمط الثغرة متطابق مع حالات IDOR الأخرى: معرف رقمي في الـ URL بدون التحقق من الملكية. لكن التأثير يُكبَّر لأن مفاتيح API تُتيح وصولاً آلياً ومستمراً للمنصة بأكملها.',
    },
    impact: {
      en: 'An attacker with the admin master API key has permanent programmatic full-access to the entire platform: all users, billing, configurations, and data. API key theft is silent — no login events, no session creation, no 2FA prompts. The compromise may go undetected for months.',
      ar: 'المهاجم الذي لديه مفتاح API الرئيسي للأدمن يمتلك وصولاً برمجياً دائماً وكاملاً للمنصة بأكملها: جميع المستخدمين والفوترة والإعدادات والبيانات. سرقة مفتاح API صامتة — لا أحداث تسجيل دخول، لا إنشاء جلسة، لا مطالبات 2FA. قد يمر الاختراق دون اكتشاف لأشهر.',
    },
    fix: [
      'Object-level auth: verify apiKey.userId === req.user.id before returning ANY key data',
      'Principle of least privilege: API keys should have minimum required permissions, admin keys must be extra protected',
      'Secret masking: return only the last 4 characters of the secret (sk_****abc123) in list views — full reveal requires a separate confirmed action',
      'UUIDs over sequential IDs: makes enumeration computationally infeasible',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Your API key is KEY-201. The response includes your key secret and permissions. What if you request KEY-202? Does the server check who owns it?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Enumerate KEY-201 through KEY-210. Look for a key with tier: "MASTER" or permissions including "admin:full_access".',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'The admin master key is somewhere between KEY-205 and KEY-210. It has a warning field: "This key grants full platform control." The flag is embedded in the permissions array.',
    },
  ],

  flagAnswer: 'FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}',
  initialState: {
    contents: [
      {
        title: 'KEY-201',
        body: JSON.stringify({
          secret: 'sk_live_usr_abc123',
          permissions: ['read:own', 'write:own'],
          tier: 'basic',
          owner: 'dev_john',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-202',
        body: JSON.stringify({
          secret: 'sk_live_usr_def456',
          permissions: ['read:own', 'write:own', 'deploy:basic'],
          tier: 'pro',
          owner: 'dev_sara',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-203',
        body: JSON.stringify({
          secret: 'sk_live_usr_ghi789',
          permissions: ['read:own'],
          tier: 'free',
          owner: 'dev_mike',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-204',
        body: JSON.stringify({
          secret: 'sk_live_usr_jkl012',
          permissions: ['read:own', 'write:own', 'billing:manage'],
          tier: 'pro',
          owner: 'dev_ana',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-205',
        body: JSON.stringify({
          secret: 'sk_live_usr_mno345',
          permissions: ['read:own', 'write:own'],
          tier: 'basic',
          owner: 'dev_omar',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-206',
        body: JSON.stringify({
          secret: 'sk_live_usr_pqr678',
          permissions: ['read:own', 'write:own', 'team:manage'],
          tier: 'enterprise',
          owner: 'dev_lena',
        }),
        author: 'apikey',
        isPublic: false,
      },
      {
        title: 'KEY-207',
        body: JSON.stringify({
          secret: 'sk_master_ADMIN_9x8y7z6w5v4u3t2s1r',
          permissions: [
            'admin:full_access',
            'platform:superuser',
            'billing:all',
            'users:manage',
            'flag:FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}',
          ],
          tier: 'MASTER',
          owner: 'platform_admin',
          warning:
            'This key grants full platform control. Handle with extreme care.',
        }),
        author: 'admin_apikey',
        isPublic: false,
      },
    ],
  },
};
