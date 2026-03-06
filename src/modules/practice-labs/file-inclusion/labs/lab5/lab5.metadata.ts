// src/modules/practice-labs/file-inclusion/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab5Metadata: LabMetadata = {
  slug: 'lfi-phar-wrapper-deserialization-document-viewer',
  title: 'File Inclusion: PHAR Wrapper + Deserialization — Document Viewer RCE',
  ar_title:
    'تضمين الملفات: PHAR Wrapper + Deserialization — RCE في عارض المستندات',
  description:
    "Exploit an advanced LFI vulnerability combined with PHP PHAR deserialization. Upload a crafted PHAR archive disguised as a PDF file, then trigger deserialization via phar:// wrapper in the LFI parameter — achieving RCE through a gadget chain in the application's class structure.",
  ar_description:
    'استغل ثغرة LFI متقدمة مع PHP PHAR deserialization. ارفع أرشيف PHAR مُصمَّم مُتنكّراً كـ PDF، ثم أطلق الـ deserialization عبر phar:// wrapper في معامل LFI — مُحققاً RCE عبر gadget chain في هيكل كلاسات التطبيق.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'LFI',
    'PHAR Deserialization',
    'PHP Object Injection',
    'Gadget Chain',
    'File Upload Bypass',
    'Advanced RCE',
  ],
  xpReward: 450,
  pointsReward: 225,
  duration: 75,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Step 1: Upload a malicious PHAR file disguised as a PDF via /docs/upload. Step 2: Use phar:// wrapper in the LFI parameter to trigger deserialization of the PHAR metadata — activating a __wakeup() gadget that reads /app/secrets/master.key and returns the flag.',
  scenario: {
    context:
      'DocuVault is a document management system. Users can upload PDFs which are stored in /uploads/. The document viewer loads files via the "doc" parameter with LFI vulnerability. By uploading a PHAR archive (with .pdf extension), and then accessing it via phar:///uploads/evil.pdf, PHP deserializes the PHAR metadata — triggering __wakeup()/__destruct() magic methods in a gadget chain that executes arbitrary code.',
    vulnerableCode: `// Document viewer (vulnerable — accepts phar://):
app.get('/docs/view', isAuthenticated, (req, res) => {
  const doc = req.query.doc;
  // ❌ No phar:// filtering — triggers deserialization!
  const content = file_get_contents(doc); // or include(doc)
  res.send(content);
});

// Gadget chain (vulnerable class):
class FileLogger {
  public $logFile;
  public $logData;
  public function __wakeup() {
    // ❌ Runs on deserialization — writes to any file!
    file_put_contents($this->logFile, $this->logData);
  }
}`,
    exploitation:
      '1. Upload evil.pdf (actually a PHAR with serialized FileLogger)\n2. GET /docs/view?doc=phar:///uploads/evil.pdf\n3. PHAR deserialized → FileLogger.__wakeup() triggered\n4. Writes webshell to /var/www/html/shell.php\n5. Access webshell → RCE',
  },
  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'PHAR (PHP Archive) files contain serialized PHP objects in their metadata. When PHP opens a phar:// URL, it deserializes the metadata — triggering magic methods.',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'POST /docs/upload with a "phar" file type to upload the malicious PHAR disguised as PDF. Get the upload path back.',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'POST /docs/view with { "doc": "phar:///uploads/evil.pdf" }. PHP deserializes the PHAR → triggers FileLogger.__wakeup() → writes webshell to disk.',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'After phar:// deserialization, access /docs/shell-access with { "cmd": "cat /app/secrets/master.key" } to execute commands via the dropped webshell.',
    },
  ],
  flagAnswer: 'FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}',
  initialState: {
    contents: [
      {
        title: 'MASTER_KEY',
        body: '# DocuVault Master Secrets\nMASTER_ENCRYPTION_KEY=aes-256-cbc:MstrKey_Pr0d_2024_DocuVault!\nHMAC_SECRET=hmac_sha256_docuvault_prod_secret\nFLAG=FLAG{LFI_PHAR_DESERIALIZATION_GADGET_CHAIN_DOCUVAULT_RCE}\nADMIN_OVERRIDE_TOKEN=ovrd_tok_docuvault_2024',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
