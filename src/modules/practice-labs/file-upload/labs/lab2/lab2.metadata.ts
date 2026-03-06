// src/modules/practice-labs/file-upload/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab2Metadata: LabMetadata = {
  slug: 'fu-mime-type-bypass-document-manager',
  title: 'File Upload: MIME Type Bypass — Document Manager Webshell',
  ar_title: 'رفع الملفات: تجاوز MIME Type — Webshell في مدير المستندات',
  description:
    'Exploit a file upload vulnerability where the server validates only the Content-Type header sent by the client. Override the MIME type in the request to "image/jpeg" while uploading a PHP webshell — the server trusts the client-supplied header completely.',
  ar_description:
    'استغل ثغرة رفع ملفات حيث يتحقق الخادم فقط من Content-Type header المرسل من العميل. غيّر MIME type في الطلب إلى "image/jpeg" مع رفع PHP webshell — الخادم يثق بالـ header بالكامل.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'MIME Bypass',
    'Content-Type Manipulation',
    'Client-Side Validation Bypass',
  ],
  xpReward: 220,
  pointsReward: 110,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'DocuVault checks Content-Type header but not actual file content. Send a PHP webshell with Content-Type: image/jpeg to bypass validation. Then execute the webshell to read /var/app/confidential/payroll.txt.',
  scenario: {
    context:
      'DocuVault DMS validates files by checking req.file.mimetype (the Content-Type header sent by the browser). This is 100% attacker-controlled. By intercepting the request and changing Content-Type to "image/jpeg", any file passes validation — including a PHP webshell.',
    vulnerableCode: `// Document upload (vulnerable — trusts Content-Type):
app.post('/docs/upload', upload.single('file'), (req, res) => {
  const mimeType = req.file.mimetype; // ❌ From HTTP header — attacker-controlled!
  const allowed  = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(mimeType)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  fs.writeFileSync('/uploads/' + req.file.originalname, req.file.buffer);
  res.json({ success: true, url: '/uploads/' + req.file.originalname });
});`,
    exploitation:
      'POST /docs/upload with filename: "report.php", mimeType: "image/jpeg", fileContent: PHP webshell. Server checks mimeType (passes!) but stores the actual PHP file.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The server checks "Content-Type" header — but who sends that header? The CLIENT (you). What if you send Content-Type: image/jpeg but the file contains PHP code?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'POST /docs/upload with { "filename": "report.php", "mimeType": "image/jpeg", "fileContent": "webshell" }. MIME says image, file IS PHP.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'The server trusts your mimeType parameter. Upload with mimeType: "image/jpeg" and filename: "shell.php". Get back the upload URL.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'POST /docs/execute with { "filename": "shell.php", "cmd": "cat /var/app/confidential/payroll.txt" } to read the flag.',
    },
  ],
  flagAnswer: 'FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
  initialState: {
    contents: [
      {
        title: 'PAYROLL_TXT',
        body: 'PAYROLL Q1 2024\n================\nCEO: $450,000\nCTO: $380,000\nFLAG: FLAG{FILE_UPLOAD_MIME_TYPE_BYPASS_CLIENT_CONTROLLED_HEADER}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
