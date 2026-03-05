// src/modules/practice-labs/xss/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab5Metadata: LabMetadata = {
  slug: 'xss-webhook-second-order',
  title: 'XSS: Second-Order Webhook Admin Takeover',
  ar_title: 'XSS من الدرجة الثانية: الاستيلاء على حساب المشرف عبر Webhook',
  description:
    'Plant a second-order XSS payload in a webhook integration name that executes when the super-admin visits the Activity Log dashboard — stealing their session token.',
  ar_description:
    'ازرع payload XSS من الدرجة الثانية في اسم تكامل Webhook ينفذ عندما يزور المشرف الأعلى لوحة سجل النشاط — مما يسرق رمز جلسته.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Second-Order Stored XSS',
    'Multi-Context Injection',
    'Admin Session Hijacking',
    'SaaS Integration Attack Surface',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: "Create a webhook integration with a malicious name. Then trigger the super-admin's Activity Log view to execute your payload in the admin's browser context and capture their session token as the flag.",
  scenario: {
    context:
      'FlowSync is a SaaS automation platform (like Zapier). Users can create webhook integrations with custom names (e.g., "Slack Notifications", "GitHub Deploy Hook"). All webhook activity is logged in a shared Activity Log visible to super-admins. The integration name is stored safely during creation — but is rendered unsafely when the super-admin reviews the activity log to audit user actions.',
    vulnerableCode: `// Webhook creation — stored safely (no issue here):
await db.integrations.create({ name: webhookName, userId });

// Activity Log rendering — rendered UNSAFELY (the vulnerability):
activityLog.forEach(entry => {
  logContainer.innerHTML += 
    \`<tr><td>\${entry.user}</td><td>\${entry.webhookName}</td><td>\${entry.action}</td></tr>\`;
});`,
    exploitation:
      'The injection point is the webhook name. It is stored raw and later rendered in the admin\'s activity log without sanitization. Craft a webhook name containing an XSS payload. The payload does nothing when you create it — it only fires when the admin loads the activity log. This is what makes it "second-order": the storage and execution contexts are completely different.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Create a webhook with the name <b>Test Hook</b>. Check if the Activity Log renders it as bold text — this confirms HTML injection in the log rendering context.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'The webhook creation itself is safe. The vulnerability is in how the Activity Log renders the name. Think about where and when the admin would trigger execution.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Craft a webhook name with an SVG payload: <svg onload="alert(1)">. Then use the "Simulate Admin Activity Log" endpoint to trigger the admin context render.',
    },
    {
      order: 4,
      xpCost: 80,
      content:
        'Full attack: Create webhook named <svg onload="alert(document.cookie)"> (or an img onerror variant). Click "Admin Views Activity Log." The backend will detect XSS execution in the admin context and release the admin session token as the flag.',
    },
  ],

  flagAnswer: 'FLAG{XSS_2ND_ORDER_WEBHOOK_ADMIN_PWNED_X9}',
  initialState: {
    users: [
      {
        username: 'super_admin',
        password: 'SUP3R_S3CUR3_ADM!N_PASS',
        role: 'ADMIN',
      },
      {
        username: 'integration_manager',
        password: 'int_mgr_2024!',
        role: 'USER',
      },
    ],
    contents: [
      {
        title: 'Slack Notifications',
        body: 'webhook',
        meta: {
          endpoint: 'https://hooks.slack.com/xxx',
          events: ['deploy', 'alert'],
          status: 'active',
        },
      },
      {
        title: 'GitHub Deploy Trigger',
        body: 'webhook',
        meta: {
          endpoint: 'https://api.github.com/repos/xxx/dispatches',
          events: ['push'],
          status: 'active',
        },
      },
    ],
    logs: [
      {
        action: 'WEBHOOK_CREATED',
        meta: {
          webhookName: 'Slack Notifications',
          createdBy: 'integration_manager',
          timestamp: '2026-02-28T10:00:00Z',
        },
      },
      {
        action: 'WEBHOOK_TRIGGERED',
        meta: {
          webhookName: 'GitHub Deploy Trigger',
          triggeredBy: 'system',
          status: 'success',
          timestamp: '2026-03-01T08:30:00Z',
        },
      },
    ],
  },
};
