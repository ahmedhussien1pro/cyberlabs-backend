// src/modules/practice-labs/xss/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab4Metadata: LabMetadata = {
  slug: 'xss-markdown-bio-escape',
  title: 'XSS: Unsafe Markdown Bio Injection',
  ar_title: 'XSS عبر Markdown: حقن سيرة المطور',
  description:
    'Exploit an unsafe Markdown renderer on a developer portfolio platform to inject a persistent XSS payload into your profile bio that executes when an admin reviews your profile.',
  ar_description:
    'استغل محلل Markdown غير آمن في منصة محافظ المطورين لحقن payload XSS مستمر في السيرة الذاتية ينفذ عند مراجعة المشرف للملف الشخصي.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Stored XSS',
    'Markdown Parser Bypass',
    'Context-Aware Payload Crafting',
    'HTML-in-Markdown',
  ],
  xpReward: 280,
  pointsReward: 130,
  duration: 50,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: "Update your developer bio with an XSS payload embedded in Markdown. Then trigger the admin profile review to simulate your payload executing in the admin's browser context.",
  scenario: {
    context:
      'DevShowcase is a platform where developers publish portfolios. Bios support Markdown for formatting. The platform uses marked.js without the sanitize option (deprecated in newer versions but common in legacy apps). Raw HTML embedded within Markdown is passed through as-is. An admin "Profile Reviewer" approves new profiles before they go public. When the admin opens the profile review panel, all pending bios are rendered directly as HTML.',
    vulnerableCode: `// Profile bio is stored raw, rendered with marked.js:
import { marked } from 'marked';
// ❌ No sanitizer configured:
profileBioElement.innerHTML = marked.parse(user.bio);`,
    exploitation:
      'Markdown parsers that allow inline HTML will render your injected tags. You can embed raw HTML directly in the bio text. Try tags that use event handlers (like <details> or <img>) since <script> tags may be blocked. The key insight: the Markdown context gives you a bypass route that a plain HTML filter might miss.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Update your bio with a plain HTML tag first: <b>Bold</b> — if the rendered preview shows bold text (not the literal tag), the Markdown parser is passing raw HTML through.',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'Now that HTML works, try an event-based tag. The classic <script> may not work inside innerHTML injection. Consider tags with auto-firing events: <img src=x onerror=...> or <details open ontoggle=...>.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Try this bio: "I am a full-stack developer. <details open ontoggle=alert(1)><summary>Skills</summary>React, Node</details>" — the ontoggle event fires automatically when the details element opens.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'For the flag, use a payload that simulates stealing the admin token: <img src=x onerror="alert(document.cookie)">. Update your bio, then click "Request Admin Review" to trigger the admin context rendering.',
    },
  ],

  flagAnswer: 'FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519}',
  initialState: {
    users: [
      {
        username: 'admin_reviewer',
        password: 'R3v!ewer_s3cur3_pass',
        role: 'ADMIN',
      },
    ],
    contents: [
      {
        title: 'Developer Profile',
        body: 'I am a passionate developer with 5 years of experience in React and Node.js.',
        meta: {
          skills: ['React', 'Node.js', 'TypeScript'],
          github: 'dev_user_99',
          status: 'pending_review',
        },
      },
    ],
  },
};
