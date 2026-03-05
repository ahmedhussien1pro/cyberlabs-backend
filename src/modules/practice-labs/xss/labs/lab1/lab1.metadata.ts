// src/modules/practice-labs/xss/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab1Metadata: LabMetadata = {
  slug: 'xss-asset-search-reflect',
  title: 'XSS: IT Asset Search Reflection',
  ar_title: 'XSS انعكاسي: نظام تتبع الأصول',
  description:
    'Exploit a Reflected XSS vulnerability in an enterprise IT asset management system where search input is echoed unsafely into the HTML response.',
  ar_description:
    'استغل ثغرة XSS الانعكاسية في نظام إدارة أصول IT داخلي حيث يتم عكس مدخل البحث مباشرة في استجابة HTML دون ترميز.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['Reflected XSS', 'HTML Injection', 'Output Encoding'],
  xpReward: 100,
  pointsReward: 50,
  duration: 20,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: "Inject a script payload into the asset search field to simulate stealing a session cookie from the IT admin's browser.",
  scenario: {
    context:
      'You are auditing an internal IT Asset Management portal used by a Fortune 500 company. The system tracks hardware (laptops, servers) and software licenses. The search endpoint returns results or an error message like: "Asset [query] not found in inventory." The query value is injected directly into the HTML without sanitization.',
    vulnerableCode: `// Backend response (unsanitized):
const message = \`Asset '\${query}' not found in inventory\`;
res.send(\`<h2>\${message}</h2>\`);`,
    exploitation:
      'Inject an HTML event handler into the search query. Since the query lands inside an HTML context, payloads like <img src=x onerror=alert(document.cookie)> will execute immediately when the page renders.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Notice that when you search for something that doesn\'t exist, the page says "Asset [your input] not found." Your input is literally in the HTML. What happens if your input contains HTML tags?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try searching for <b>test</b> — if the text appears bold in the response, HTML injection is confirmed. Now think about event-based XSS.',
    },
    {
      order: 3,
      xpCost: 30,
      content:
        'Use an image tag with an error event: <img src=x onerror=alert(1)>. The image will fail to load, triggering onerror immediately.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'Full payload: search for <img src=x onerror="alert(document.cookie)"> — this simulates a session cookie theft from the browser context.',
    },
  ],

  flagAnswer: 'FLAG{XSS_REFLECT_ASSET_MGR_101}',
  initialState: {
    contents: [
      {
        title: 'Dell XPS 15 Laptop',
        body: 'hardware',
        meta: { assetId: 'HW-001', assignedTo: 'john.doe', status: 'active' },
      },
      {
        title: 'Windows Server 2022 License',
        body: 'software',
        meta: { assetId: 'SW-042', seats: 10, status: 'active' },
      },
      {
        title: 'Cisco Switch 24-Port',
        body: 'network',
        meta: {
          assetId: 'NW-007',
          location: 'Server Room B',
          status: 'maintenance',
        },
      },
    ],
  },
};
