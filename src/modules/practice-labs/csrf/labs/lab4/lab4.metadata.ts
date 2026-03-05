// src/modules/practice-labs/csrf/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const csrfLab4Metadata: LabMetadata = {
  slug: 'csrf-cors-cicd-pipeline-attack',
  title: 'CSRF + CORS: CI/CD Pipeline — Trigger Malicious Deployment',
  ar_title: 'CSRF + CORS: خط CI/CD — تشغيل نشر خبيث',
  description:
    'Chain a CSRF attack with a CORS misconfiguration in a CI/CD platform. The API trusts all subdomains via wildcard CORS, and has no CSRF protection. Use a malicious subdomain to make authenticated cross-origin requests and trigger a production deployment of a backdoored build.',
  ar_description:
    'سلسل هجوم CSRF مع إعداد CORS خاطئ في منصة CI/CD. تثق الـ API بجميع النطاقات الفرعية عبر CORS wildcard، وليس لديها حماية CSRF. استخدم نطاقاً فرعياً خبيثاً لإجراء طلبات مصادقة عبر الأصول وتشغيل نشر إنتاجي لبناء مزروع بـ backdoor.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'CSRF',
    'CORS Misconfiguration',
    'CI/CD Security',
    'Chained Attacks',
    'Supply Chain Attack',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The CI/CD API sets CORS: Access-Control-Allow-Origin: *.pipelinehub.io with credentials. Use a "subdomain" origin to make credentialed CORS requests and trigger a production deployment of build #BACKDOOR-BUILD to retrieve the flag.',
  scenario: {
    context:
      'PipelineHub CI/CD platform has CORS configured as: Access-Control-Allow-Origin: *.pipelinehub.io with credentials:true. An attacker controls docs.pipelinehub.io (a docs subdomain with XSS). CORS trusts all subdomains → attacker can make credentialed API requests from docs.pipelinehub.io. The /deploy endpoint has no CSRF token. Combined: attacker triggers production deployment.',
    vulnerableCode: `// CORS config (vulnerable):
app.use(cors({
  origin: (origin, cb) => {
    // ❌ Wildcard subdomain — trusts ALL subdomains including attacker-controlled ones
    if (origin?.endsWith('.pipelinehub.io')) cb(null, true);
    else cb(null, false);
  },
  credentials: true, // ❌ Allows cookies with CORS
}));

// Deploy endpoint (no CSRF protection):
app.post('/deploy', isAuthenticated, async (req, res) => {
  const { buildId, environment } = req.body;
  // ❌ No CSRF token check
  await pipeline.deploy(buildId, environment);
});`,
    exploitation:
      '1. Simulate being on docs.pipelinehub.io (trusted subdomain). 2. Make a credentialed CORS request to /deploy with buildId: BACKDOOR-BUILD, environment: production. 3. The CORS policy allows it, cookies are sent, deployment triggers.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Check the CORS headers on the API. Notice: Access-Control-Allow-Origin: *.pipelinehub.io. What subdomains does the attacker control?',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'The deploy endpoint has no CSRF token. If you could make a credentialed request from a trusted subdomain, it would work. Use /csrf/simulate-subdomain-request.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'POST /csrf/simulate-subdomain-request with { "origin": "https://docs.pipelinehub.io", "buildId": "BACKDOOR-BUILD", "environment": "production" }',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        'The subdomain origin is trusted by CORS. Cookies are included (credentials: true). The deploy triggers. Check /deployments/history for the flag.',
    },
  ],
  flagAnswer: 'FLAG{CSRF_CORS_WILDCARD_SUBDOMAIN_CICD_DEPLOY_BACKDOOR}',
  initialState: {
    contents: [
      {
        title: 'BUILD-001',
        body: JSON.stringify({
          buildId: 'BUILD-001',
          branch: 'main',
          status: 'success',
          commit: 'abc123',
          safe: true,
        }),
        author: 'build',
        isPublic: false,
      },
      {
        title: 'BUILD-002',
        body: JSON.stringify({
          buildId: 'BUILD-002',
          branch: 'feature/login',
          status: 'success',
          commit: 'def456',
          safe: true,
        }),
        author: 'build',
        isPublic: false,
      },
      {
        title: 'BACKDOOR-BUILD',
        body: JSON.stringify({
          buildId: 'BACKDOOR-BUILD',
          branch: 'malicious/backdoor',
          status: 'ready',
          commit: 'evil999',
          safe: false,
          contains: 'reverse_shell.js',
        }),
        author: 'malicious_build',
        isPublic: false,
      },
    ],
  },
};
