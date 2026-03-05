// src/modules/practice-labs/xss/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab3Metadata: LabMetadata = {
  slug: 'xss-dom-notification-hijack',
  title: 'XSS: DOM-Based Notification Hijack',
  ar_title: 'XSS عبر DOM: اختطاف نظام الإشعارات',
  description:
    'Exploit a DOM-based XSS vulnerability in a project management SPA where the notification banner reads its message directly from the URL parameter using innerHTML.',
  ar_description:
    'استغل ثغرة XSS في الـ DOM داخل منصة إدارة المشاريع، حيث يقرأ شريط الإشعارات رسالته مباشرة من بارامتر الـ URL باستخدام innerHTML.',
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

  goal: 'Craft a malicious URL containing an XSS payload in the ?msg= parameter. Submit this URL to the verification endpoint to prove the DOM-based execution would occur in a real browser.',
  scenario: {
    context:
      "SprintBoard is a project management SaaS. When a teammate mentions you in a task, the system sends you a link like: https://sprintboard.app/dashboard?msg=You+have+been+assigned+Sprint+%2314. The dashboard JavaScript reads this msg parameter and displays it as a notification using innerHTML — without any sanitization. The server never sees this parameter; it's processed entirely by the browser.",
    vulnerableCode: `// Frontend JavaScript (client-side sink):
const params = new URLSearchParams(window.location.search);
const msg = params.get('msg');
// ❌ DOM Sink: innerHTML without sanitization
document.getElementById('notification-banner').innerHTML = msg;`,
    exploitation:
      'Craft a URL where the ?msg= value contains an HTML payload with an event handler. Since the server is not involved, the XSS bypasses any server-side filtering. The browser directly injects your payload into the DOM.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        "This is a DOM-based XSS. The server never touches the ?msg= parameter — it's processed entirely in the browser JavaScript. Try navigating to the lab URL with ?msg=<b>Hello</b> and see if it renders bold.",
    },
    {
      order: 2,
      xpCost: 25,
      content:
        "Since the injection goes into innerHTML, script tags won't work directly (they don't execute when inserted via innerHTML). Use an event-based payload instead, like an image with onerror.",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        'Try: ?msg=<img src=x onerror=alert(1)> — does the notification area show a broken image? If yes, the onerror fires.',
    },
    {
      order: 4,
      xpCost: 55,
      content:
        'Full payload: ?msg=<img src=x onerror="alert(document.cookie)">. URL-encode it properly and submit the full crafted URL to the /verify endpoint to get your flag.',
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
