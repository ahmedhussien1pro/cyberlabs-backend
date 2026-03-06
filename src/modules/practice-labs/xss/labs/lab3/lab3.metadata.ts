// src/modules/practice-labs/xss/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab3Metadata: LabMetadata = {
  slug: 'xss-dom-notification-hijack',
  title: 'XSS: DOM-Based Notification Hijack',
  ar_title: 'XSS عبر DOM: اختطاف نظام الإشعارات',
  description:
    'Exploit a DOM-based XSS vulnerability in a project management SPA where the notification banner reads its message directly from the URL parameter using innerHTML.',
  ar_description:
    'استغل ثغرة XSS في الـ DOM داخل SPA إدارة مشاريع، حيث يقرأ شريط الإشعارات رسالته مباشرة من بارامتر الـ URL باستخدام innerHTML.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'DOM-Based XSS',
    'Client-Side Sinks',
    'innerHTML Exploitation',
    'URL Parameter Injection',
  ],
  xpReward: 200,
  pointsReward: 100,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Craft a malicious URL containing an XSS payload in the ?msg= parameter. Submit this URL to the verification endpoint to prove DOM-based execution would occur in a real browser.',
  ar_goal:
    'صمّم URL خبيثاً يحتوي على XSS payload في بارامتر ?msg=. أرسل هذا الـ URL إلى نقطة التحقق لإثبات أن التنفيذ المبني على DOM سيحدث في متصفح حقيقي.',

  briefing: {
    en: `SprintBoard — a project management SaaS used by agile development teams.
When a teammate assigns you to a task, you get a notification link:
https://sprintboard.app/dashboard?msg=You+have+been+assigned+Sprint+%2314
The dashboard JavaScript reads the ?msg= URL parameter.
It displays it as a notification banner.
Using innerHTML.
The server never processes this parameter.
It never sees it. It never validates it.
The browser reads it directly from window.location.search.
And writes it directly into the DOM.
No encoding. No sanitization. No server-side filter to bypass.
Just the browser, the URL, and a vulnerable innerHTML call.`,
    ar: `SprintBoard — SaaS إدارة مشاريع تستخدمه فرق التطوير الرشيق.
عندما يُعيّنك زميل لمهمة، تتلقى رابط إشعار:
https://sprintboard.app/dashboard?msg=You+have+been+assigned+Sprint+%2314
يقرأ JavaScript لوحة التحكم بارامتر ?msg= من الـ URL.
يعرضه كشريط إشعار.
باستخدام innerHTML.
الخادم لا يعالج هذا البارامتر أبداً.
لا يراه. لا يتحقق منه.
يقرأه المتصفح مباشرة من window.location.search.
ويكتبه مباشرة في الـ DOM.
لا ترميز. لا تعقيم. لا فلتر على جانب الخادم لتجاوزه.
فقط المتصفح، الـ URL، واستدعاء innerHTML ضعيف.`,
  },

  stepsOverview: {
    en: [
      'Navigate to the dashboard with a test ?msg= value — observe it rendered in the notification banner',
      'Test HTML injection: ?msg=<b>Hello</b> — if bold renders, innerHTML is confirmed',
      "Understand why <script> tags don't work via innerHTML injection",
      'Use an event-based payload that fires without user interaction',
      'Submit the crafted URL to /verify to confirm execution',
    ],
    ar: [
      'انتقل إلى لوحة التحكم بقيمة ?msg= تجريبية — لاحظ عرضها في شريط الإشعارات',
      'اختبر حقن HTML: ?msg=<b>Hello</b> — إن عُرض بخط عريض، تم تأكيد innerHTML',
      'افهم لماذا وسوم <script> لا تعمل عبر حقن innerHTML',
      'استخدم payload مبني على حدث يُطلَق بدون تفاعل المستخدم',
      'أرسل الـ URL المصمَّم إلى /verify لتأكيد التنفيذ',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SprintBoard dashboard reads the ?msg= URL parameter in client-side JavaScript and writes it to the DOM using innerHTML — a classic DOM sink. The server never processes this parameter, so server-side input validation is completely irrelevant. The payload only needs to bypass client-side context.',
    vulnerableCode:
      '// Frontend JavaScript (client-side sink):\n' +
      'const params = new URLSearchParams(window.location.search);\n' +
      "const msg = params.get('msg');\n" +
      '// ❌ DOM Sink: innerHTML without sanitization\n' +
      "document.getElementById('notification-banner').innerHTML = msg;",
    exploitation:
      'Craft URL: /dashboard?msg=<img src=x onerror=alert(document.cookie)>. The msg parameter is read by JS and written to innerHTML. The img tag fails to load, onerror fires with document.cookie.',
    steps: {
      en: [
        '/dashboard?msg=<b>Hello</b> → notification shows "Hello" in bold → innerHTML confirmed',
        '/dashboard?msg=<script>alert(1)</script> → nothing happens → script tags blocked by innerHTML (correct)',
        '/dashboard?msg=<img src=x onerror=alert(1)> → image fails → onerror fires → alert(1) executes',
        'POST /verify { "url": "/dashboard?msg=<img src=x onerror=alert(document.cookie)>" } → flag returned',
      ],
      ar: [
        '/dashboard?msg=<b>Hello</b> → تُظهر الإشعار "Hello" بخط عريض → تم تأكيد innerHTML',
        '/dashboard?msg=<script>alert(1)</script> → لا شيء يحدث → وسوم script محظورة بواسطة innerHTML (صحيح)',
        '/dashboard?msg=<img src=x onerror=alert(1)> → فشل الصورة → يُطلَق onerror → ينفذ alert(1)',
        'POST /verify { "url": "/dashboard?msg=<img src=x onerror=alert(document.cookie)>" } → يُعاد العلم',
      ],
    },
    fix: [
      'Replace innerHTML with textContent for plain text rendering: element.textContent = msg',
      'If HTML rendering is needed: sanitize first: element.innerHTML = DOMPurify.sanitize(msg)',
      'Never read from location.search/hash and write to innerHTML directly',
      "CSP: script-src 'self' nonce-{nonce} — blocks inline event handlers even if injected",
    ],
  },

  postSolve: {
    explanation: {
      en: 'DOM-Based XSS is fundamentally different from Reflected and Stored XSS — the server is never involved. The attack flows entirely within the browser: a JavaScript source (location.search) writes to a dangerous sink (innerHTML) without sanitization. This means server-side WAFs and input validation are completely bypassed. The payload never hits the server.',
      ar: 'الـ DOM-Based XSS مختلف جذرياً عن Reflected وStored XSS — الخادم غير متورط أبداً. يتدفق الهجوم بالكامل داخل المتصفح: مصدر JavaScript (location.search) يكتب إلى sink خطير (innerHTML) بدون تعقيم. هذا يعني أن WAFs جانب الخادم والتحقق من المدخلات مُتجاوَز تماماً. الـ payload لا يصل إلى الخادم أبداً.',
    },
    impact: {
      en: "Since the malicious URL can be sent via phishing (email, messages, social engineering), the attacker can target specific victims. The URL appears to belong to the legitimate domain, making it highly convincing. Any user who clicks the crafted link has their browser execute the attacker's code.",
      ar: 'نظراً لأنه يمكن إرسال الـ URL الخبيث عبر التصيد الاحتيالي (بريد إلكتروني، رسائل، هندسة اجتماعية)، يمكن للمهاجم استهداف ضحايا بعينهم. يبدو الـ URL كأنه ينتمي للنطاق الشرعي، مما يجعله مقنعاً للغاية. أي مستخدم ينقر على الرابط المصمَّم ينفذ كود المهاجم في متصفحه.',
    },
    fix: [
      'Audit all client-side code for the source→sink pattern: location.search/hash → innerHTML/outerHTML/eval',
      'Use textContent over innerHTML for non-HTML content: always',
      'DOMPurify for rich content: import and call DOMPurify.sanitize() before innerHTML',
      'Trusted Types API (modern browsers): enforce safe DOM operations at browser level',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'This is DOM-Based XSS — the server never processes ?msg=. Navigate to /dashboard?msg=<b>Hello</b> and see if the notification area renders bold text. If yes, innerHTML is confirmed.',
    },
    {
      order: 2,
      xpCost: 25,
      content:
        '<script> tags injected via innerHTML do NOT execute (browser security). Use event-handler-based payloads instead, like <img src=x onerror=alert(1)> which fires automatically when the image fails.',
    },
    {
      order: 3,
      xpCost: 40,
      content:
        'Full payload URL: /dashboard?msg=<img src=x onerror="alert(document.cookie)">. URL-encode the payload and POST it to /verify to get the flag.',
    },
  ],

  flagAnswer: 'FLAG{XSS_DOM_SINK_INNERHTML_EXPLOIT_344}',
  initialState: {
    users: [
      { username: 'dev_sarah', password: 'sarah_dev_2024!', role: 'USER' },
    ],
    contents: [
      {
        title: 'Sprint #14',
        body: 'active',
        meta: { tasks: 12, completed: 8, dueDate: '2026-03-15' },
      },
      {
        title: 'Sprint #15 Planning',
        body: 'upcoming',
        meta: { tasks: 0, completed: 0, dueDate: '2026-03-29' },
      },
    ],
  },
};
