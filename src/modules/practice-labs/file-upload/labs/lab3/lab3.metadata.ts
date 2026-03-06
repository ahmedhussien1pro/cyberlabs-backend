// src/modules/practice-labs/file-upload/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab3Metadata: LabMetadata = {
  slug: 'fu-magic-bytes-bypass-medical-imaging',
  title: 'File Upload: Magic Bytes Bypass — Medical PACS Imaging System',
  ar_title: 'رفع الملفات: تجاوز Magic Bytes — نظام التصوير الطبي PACS',
  description:
    'Exploit a file upload vulnerability in a medical imaging system that validates files using magic bytes (file signature). Prepend valid JPEG magic bytes (FF D8 FF) to a PHP webshell to trick the magic bytes validator while preserving PHP executability.',
  ar_description:
    'استغل ثغرة رفع ملفات في نظام تصوير طبي يتحقق من الملفات باستخدام magic bytes. أضف JPEG magic bytes صحيحة (FF D8 FF) قبل PHP webshell لخداع المُتحقق مع الحفاظ على قابلية تنفيذ PHP.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'Magic Bytes Bypass',
    'File Signature Spoofing',
    'Polyglot Files',
    'Medical System Security',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The PACS system checks magic bytes (first 4 bytes of file). Create a polyglot file: prepend "FFD8FFE0" (JPEG magic bytes) before PHP webshell code. The validator sees JPEG, Apache executes PHP. Read /etc/pacs/patient_db.conf to get the flag.',
  scenario: {
    context:
      'MediScan PACS validates uploads by reading the first 4 bytes of the file (magic bytes). A valid JPEG starts with FF D8 FF E0. By prepending these bytes to a PHP webshell, the magic bytes check passes (sees JPEG) but PHP still executes the webshell because PHP ignores binary garbage before the opening PHP tag.',
    vulnerableCode: `// PACS upload (vulnerable — magic bytes only):
app.post('/scan/upload', (req, res) => {
  const buf        = req.file.buffer;
  const magicBytes = buf.slice(0, 4).toString('hex').toUpperCase();
  if (magicBytes !== 'FFD8FFE0') {
    return res.status(400).json({ error: 'Not a JPEG' });
  }
  fs.writeFileSync('/uploads/scans/' + req.file.name, buf);
  res.json({ url: '/uploads/scans/' + req.file.name });
});`,
    exploitation:
      'Prepend "\\xFF\\xD8\\xFF\\xE0" (JPEG magic bytes) to PHP code. Magic check passes. Server stores the file. Apache parses it as PHP, ignores binary prefix, executes the PHP tag.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Magic bytes are just the first few bytes. JPEG = FF D8 FF E0. What if you put those bytes at the START of your PHP file? The checker sees JPEG magic, PHP ignores binary junk.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'A "polyglot" file is valid as TWO formats simultaneously. Prepend JPEG magic bytes (hex: FFD8FFE0) to your PHP code.',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /scan/upload with { "filename": "scan.php", "magicBytes": "FFD8FFE0", "phpPayload": "system($_GET[\'cmd\'])" }.',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'POST /scan/execute with { "filename": "scan.php", "cmd": "cat /etc/pacs/patient_db.conf" } to read the database config with the flag.',
    },
  ],
  flagAnswer: 'FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
  initialState: {
    contents: [
      {
        title: 'PATIENT_DB_CONF',
        body: 'PACS_DB_HOST=pacs-db-prod.internal\nPACS_DB_USER=mediscan_admin\nPACS_DB_PASS=M3d1Sc4n_DB_Pr0d!\nFLAG=FLAG{FILE_UPLOAD_MAGIC_BYTES_BYPASS_POLYGLOT_JPEG_PHP}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
