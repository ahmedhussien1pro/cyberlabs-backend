// src/modules/practice-labs/idor/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab2Metadata: LabMetadata = {
  slug: 'idor-api-key-management-devhub',
  title: 'IDOR: API Key Management — Steal Admin API Key',
  ar_title: 'IDOR: إدارة مفاتيح API — سرقة مفتاح API المسؤول',
  description:
    "Exploit IDOR in a developer platform where API keys are managed by numeric IDs. Enumerate key IDs to find and steal the admin's privileged API key granting full platform access.",
  ar_description:
    'استغل ثغرة IDOR في منصة المطورين حيث تُدار مفاتيح API بمعرفات رقمية. عدّد معرفات المفاتيح للعثور على مفتاح API الخاص بالمسؤول وسرقته للحصول على وصول كامل للمنصة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'API Security', 'Key Enumeration', 'Credential Theft'],
  xpReward: 230,
  pointsReward: 115,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "Your API key ID is KEY-201. Enumerate other key IDs to find the admin's master API key (KEY-2XX) and retrieve the flag embedded in its permissions.",
  scenario: {
    context:
      'DevHub is a developer API platform. Each user has API keys identified by sequential numeric IDs (KEY-201, KEY-202...). The /api-keys/{keyId} endpoint returns full key details including the secret value. There is no ownership verification — any authenticated user can access any key by ID.',
    vulnerableCode: `// API Key endpoint (vulnerable):
app.get('/api-keys/:keyId', authenticate, async (req, res) => {
  const apiKey = await db.apiKeys.findOne({ id: req.params.keyId });
  if (!apiKey) return res.status(404).json({ error: 'Key not found' });
  // ❌ Returns full key including secret — no ownership check!
  res.json({ keyId: apiKey.id, secret: apiKey.secret, permissions: apiKey.permissions });
});`,
    exploitation:
      'You know your key is KEY-201. Try KEY-202, KEY-203... until you find a key with admin-level permissions containing the flag.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Your API key is KEY-201. The response includes your key secret and permissions. What if you request KEY-202?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Enumerate KEY-201 through KEY-210. Look for a key with permissions including "admin:full_access" or "platform:superuser".',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'POST /api-keys/view with { "keyId": "KEY-205" }. Try each ID. The admin key has a special flag in the permissions object.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'The admin master key is at KEY-207. Access it to get the flag embedded in its permissions payload.',
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
