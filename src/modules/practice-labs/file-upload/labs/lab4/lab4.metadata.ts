// src/modules/practice-labs/file-upload/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab4Metadata: LabMetadata = {
  slug: 'fu-svg-xss-ssrf-social-platform',
  title: 'File Upload: SVG XSS + SSRF — Social Platform Profile Photo',
  ar_title:
    'رفع الملفات: SVG XSS + SSRF — صورة الملف الشخصي في المنصة الاجتماعية',
  description:
    "Exploit an SVG file upload vulnerability on a social platform. SVG files are XML-based and support JavaScript — upload an SVG with embedded XSS to steal admin session cookies, then exploit SVG's ability to load external resources for SSRF to access the internal cloud metadata API.",
  ar_description:
    'استغل ثغرة رفع SVG في منصة اجتماعية. ملفات SVG تعتمد على XML وتدعم JavaScript — ارفع SVG مع XSS مضمّن لسرقة session cookies، ثم استغل قدرة SVG على تحميل موارد خارجية لـ SSRF للوصول لـ cloud metadata API الداخلية.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'SVG XSS',
    'SSRF via SVG',
    'Stored XSS',
    'Cloud Metadata',
    'Content-Type Confusion',
  ],
  xpReward: 360,
  pointsReward: 180,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Upload an SVG with (1) embedded JS for stored XSS to steal admin cookies and (2) an <image href="http://169.254.169.254/..."> tag for SSRF to read cloud IAM credentials.',
  scenario: {
    context:
      'ConnectHub social platform allows SVG profile photos. SVG is XML that supports <script> tags and external resource loading. An attacker can upload an SVG with embedded JS for stored XSS, and use <image> tags to trigger SSRF against the AWS metadata endpoint — leaking cloud IAM credentials.',
    vulnerableCode: `// Profile photo upload (vulnerable — SVG allowed):
app.post('/profile/photo', upload.single('photo'), (req, res) => {
  const ext = path.extname(req.file.originalname);
  if (!['.jpg', '.png', '.gif', '.svg'].includes(ext)) { // ❌ SVG allowed!
    return res.status(400).json({ error: 'Invalid type' });
  }
  res.setHeader('Content-Type', 'image/svg+xml'); // ❌ Browser executes JS!
  res.send(req.file.buffer);
});`,
    exploitation:
      '1. Upload SVG with <script> for XSS cookie theft\n2. Upload SVG with <image href="http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role"> for SSRF\n3. Simulate view to trigger both attacks',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'SVG is XML. XML supports <script> tags. If a browser renders an SVG, it EXECUTES the JavaScript inside — stored XSS on every viewer.',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'SVG loads external resources via <image href="URL">. The server fetches that URL. What if it\'s http://169.254.169.254/latest/meta-data/?',
    },
    {
      order: 3,
      xpCost: 80,
      content:
        'POST /profile/photo/upload with attackType: "ssrf" and ssrfTarget: "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role".',
    },
    {
      order: 4,
      xpCost: 110,
      content:
        'POST /profile/photo/simulate-view with viewerRole: "admin" to trigger the attack and get the AWS IAM credentials + flag.',
    },
  ],
  flagAnswer: 'FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}',
  initialState: {
    contents: [
      {
        title: 'AWS_IAM_CREDS',
        body: JSON.stringify(
          {
            Code: 'Success',
            AccessKeyId: 'ASIA_CONNECTHUB_PROD_XYZ',
            SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            Token: 'token_connecthub_prod_session_abc123',
            FLAG: 'FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}',
          },
          null,
          2,
        ),
        author: 'aws_metadata',
        isPublic: false,
      },
    ],
  },
};
