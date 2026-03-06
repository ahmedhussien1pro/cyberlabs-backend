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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'The CI/CD API sets CORS: Access-Control-Allow-Origin: *.pipelinehub.io with credentials. Use a "subdomain" origin to make credentialed CORS requests and trigger a production deployment of build #BACKDOOR-BUILD to retrieve the flag.',
  ar_goal:
    'تضع CI/CD API إعداد CORS: Access-Control-Allow-Origin: *.pipelinehub.io مع credentials. استخدم أصل "نطاق فرعي" لإجراء طلبات CORS مع بيانات الاعتماد وتشغيل نشر إنتاجي للبناء رقم BACKDOOR-BUILD لاسترداد العلم.',

  briefing: {
    en: `PipelineHub — CI/CD automation platform. Build, test, deploy. Production deployments at the click of a button.
The API is accessed from the main app: app.pipelinehub.io.
Also from the docs: docs.pipelinehub.io.
And the status page: status.pipelinehub.io.
CORS is configured for all subdomains: *.pipelinehub.io.
With credentials: true.
The engineer thought: "Only our subdomains. That's safe."
But docs.pipelinehub.io allows user-generated content.
XSS in the docs site → controlled origin.
Or: you just simulate being docs.pipelinehub.io.
The /deploy endpoint has no CSRF token.
No Origin restriction beyond the wildcard.
BACKDOOR-BUILD is ready.
It contains reverse_shell.js.
You just need to deploy it to production.`,
    ar: `PipelineHub — منصة أتمتة CI/CD. بناء، اختبار، نشر. نشر الإنتاج بنقرة زر.
يُصَل إلى الـ API من التطبيق الرئيسي: app.pipelinehub.io.
أيضاً من المستندات: docs.pipelinehub.io.
وصفحة الحالة: status.pipelinehub.io.
CORS مُهيَّأ لجميع النطاقات الفرعية: *.pipelinehub.io.
مع credentials: true.
اعتقد المهندس: "فقط نطاقاتنا الفرعية. هذا آمن."
لكن docs.pipelinehub.io يسمح بمحتوى من إنشاء المستخدمين.
XSS في موقع المستندات → أصل متحكَّم فيه.
أو: تحاكي فقط أنك docs.pipelinehub.io.
لا يملك endpoint /deploy أي CSRF token.
لا قيود Origin تتجاوز الـ wildcard.
BACKDOOR-BUILD جاهز.
يحتوي على reverse_shell.js.
تحتاج فقط نشره في الإنتاج.`,
  },

  stepsOverview: {
    en: [
      'Inspect the CORS headers on PipelineHub API — confirm: Access-Control-Allow-Origin: *.pipelinehub.io + Access-Control-Allow-Credentials: true',
      'Identify the vulnerability: wildcard subdomain CORS trusts ANY subdomain, including attacker-controlled ones',
      'Confirm /deploy has no CSRF token protection',
      'Use /csrf/simulate-subdomain-request to simulate a credentialed cross-origin request from docs.pipelinehub.io',
      'POST /deploy { "buildId": "BACKDOOR-BUILD", "environment": "production" } — with trusted subdomain origin',
      'GET /deployments/history — confirm BACKDOOR-BUILD deployed to production → flag returned',
    ],
    ar: [
      'افحص هيدرات CORS على PipelineHub API — أكّد: Access-Control-Allow-Origin: *.pipelinehub.io + Access-Control-Allow-Credentials: true',
      'حدد الثغرة: CORS النطاق الفرعي wildcard يثق بأي نطاق فرعي، بما فيها النطاقات التي يتحكم فيها المهاجم',
      'أكّد أن /deploy لا يملك حماية CSRF token',
      'استخدم /csrf/simulate-subdomain-request لمحاكاة طلب CORS مع بيانات الاعتماد من docs.pipelinehub.io',
      'POST /deploy { "buildId": "BACKDOOR-BUILD"، "environment": "production" } — مع أصل النطاق الفرعي الموثوق',
      'GET /deployments/history — أكّد نشر BACKDOOR-BUILD في الإنتاج → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'PipelineHub CORS policy: Access-Control-Allow-Origin: *.pipelinehub.io + credentials: true. The wildcard matches any subdomain including docs.pipelinehub.io which has XSS or is attacker-controlled. Since the /deploy endpoint has no CSRF token, the attacker can make authenticated cross-origin API requests from the trusted subdomain. Combined: trigger production deployment of the backdoored build.',
    vulnerableCode:
      '// CORS config (vulnerable):\n' +
      'app.use(cors({\n' +
      '  origin: (origin, cb) => {\n' +
      '    // ❌ Wildcard subdomain — trusts ALL subdomains including attacker-controlled ones\n' +
      "    if (origin?.endsWith('.pipelinehub.io')) cb(null, true);\n" +
      '    else cb(null, false);\n' +
      '  },\n' +
      '  credentials: true, // ❌ Allows cookies with CORS\n' +
      '}));\n\n' +
      '// Deploy endpoint (no CSRF protection):\n' +
      "app.post('/deploy', isAuthenticated, async (req, res) => {\n" +
      '  const { buildId, environment } = req.body;\n' +
      '  // ❌ No CSRF token check\n' +
      '  await pipeline.deploy(buildId, environment);\n' +
      '});',
    exploitation:
      'POST /csrf/simulate-subdomain-request { "origin": "https://docs.pipelinehub.io", "targetPath": "/deploy", "body": { "buildId": "BACKDOOR-BUILD", "environment": "production" } } → CORS passes → cookies sent → deployment triggered',
    steps: {
      en: [
        'GET /api/cors-info → confirm: Access-Control-Allow-Origin accepts *.pipelinehub.io + credentials: true',
        'POST /deploy { "buildId": "BUILD-001", "environment": "staging" } from docs.pipelinehub.io origin — 200 OK → CORS bypass confirmed',
        'POST /csrf/simulate-subdomain-request { "origin": "https://docs.pipelinehub.io", "targetPath": "/deploy", "body": { "buildId": "BACKDOOR-BUILD", "environment": "production" } }',
        'GET /deployments/history → BACKDOOR-BUILD: deployed to production → flag: FLAG{CSRF_CORS_WILDCARD_SUBDOMAIN_CICD_DEPLOY_BACKDOOR}',
      ],
      ar: [
        'GET /api/cors-info → أكّد: Access-Control-Allow-Origin يقبل *.pipelinehub.io + credentials: true',
        'POST /deploy { "buildId": "BUILD-001"، "environment": "staging" } من أصل docs.pipelinehub.io — 200 OK → تم تأكيد تجاوز CORS',
        'POST /csrf/simulate-subdomain-request { "origin": "https://docs.pipelinehub.io"، "targetPath": "/deploy"، "body": { "buildId": "BACKDOOR-BUILD"، "environment": "production" } }',
        'GET /deployments/history → BACKDOOR-BUILD: مُنشَر في الإنتاج → العلم: FLAG{CSRF_CORS_WILDCARD_SUBDOMAIN_CICD_DEPLOY_BACKDOOR}',
      ],
    },
    fix: [
      'Explicit origin allowlist: instead of *.pipelinehub.io, enumerate exactly: ["https://app.pipelinehub.io", "https://status.pipelinehub.io"] — never wildcard subdomains',
      'CSRF tokens on all deployment triggers: CI/CD actions must require token validation regardless of CORS',
      'Separate auth for deployment: production deploys require a separate short-lived deployment token — not just a session cookie',
      'No user content on trusted subdomains: docs subdomains with user content must never be in the CORS allowlist',
    ],
  },

  postSolve: {
    explanation: {
      en: 'This lab demonstrates a two-layer attack: CORS misconfiguration + CSRF = credentialed cross-origin API access. The CORS wildcard subdomain policy creates an implicit trust chain: any subdomain compromise (via XSS, subdomain takeover, or user-generated content) becomes a full API compromise. CORS with credentials is especially dangerous because it means the browser sends session cookies — turning a read-vulnerability into a write-vulnerability.',
      ar: 'يُظهر هذا المختبر هجوماً ذا طبقتين: إعداد CORS خاطئ + CSRF = وصول API عبر الأصول مع بيانات الاعتماد. سياسة CORS النطاق الفرعي wildcard تخلق سلسلة ثقة ضمنية: أي اختراق نطاق فرعي (عبر XSS أو استيلاء على النطاق الفرعي أو محتوى المستخدم) يصبح اختراقاً كاملاً للـ API. CORS مع credentials خطير بشكل خاص لأنه يعني إرسال المتصفح لكوكيز الجلسة — تحويل ثغرة القراءة إلى ثغرة كتابة.',
    },
    impact: {
      en: 'Supply chain attack: a backdoored build deployed to production means every user of the application is now running attacker-controlled code. In real-world scenarios, this vector has been used to compromise thousands of downstream users through a single CI/CD pipeline manipulation (see: SolarWinds, XZ Utils patterns).',
      ar: 'هجوم سلسلة التوريد: بناء مزروع بـ backdoor مُنشَر في الإنتاج يعني أن كل مستخدم للتطبيق يُشغّل الآن كوداً يتحكم فيه المهاجم. في السيناريوهات الواقعية، تم استخدام هذا النوع من الهجمات لاختراق آلاف المستخدمين النهائيين من خلال تلاعب واحد في خط CI/CD (انظر: أنماط SolarWinds وXZ Utils).',
    },
    fix: [
      'CORS origin allowlist: explicit list of allowed origins, never wildcard subdomains',
      'Credentials isolation: separate the auth mechanism for API calls vs. session cookies — use Authorization: Bearer tokens for API (not cookies)',
      'Build signing: cryptographically sign all builds — deploys require valid signature verification',
      'Deployment approval gates: production deploys require manual approval + MFA, not just an API call',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Check the CORS response headers on the PipelineHub API. Look for Access-Control-Allow-Origin and Access-Control-Allow-Credentials. Which subdomains does the attacker have control over?',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'The CORS wildcard trusts ALL subdomains of pipelinehub.io — including docs.pipelinehub.io which has user-generated content (XSS possible). The /deploy endpoint has no CSRF token. Use /csrf/simulate-subdomain-request.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'POST /csrf/simulate-subdomain-request with: { "origin": "https://docs.pipelinehub.io", "targetPath": "/deploy", "body": { "buildId": "BACKDOOR-BUILD", "environment": "production" } }. Then check /deployments/history.',
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
