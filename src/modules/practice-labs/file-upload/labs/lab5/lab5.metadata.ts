// src/modules/practice-labs/file-upload/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab5Metadata: LabMetadata = {
  slug: 'fu-zip-slip-backup-manager-rce',
  title: 'File Upload: ZIP Slip — DevOps Backup Manager Path Traversal RCE',
  ar_title:
    'رفع الملفات: ZIP Slip — RCE عبر اجتياز المسار في مدير النسخ الاحتياطي',
  description:
    'Exploit a ZIP Slip vulnerability in a DevOps backup manager. Craft a malicious ZIP archive containing files with path traversal in their names (e.g., "../../var/www/html/shell.php"). When the server extracts the ZIP without validating paths, files are written outside the target directory — overwriting system files or dropping a webshell.',
  ar_description:
    'استغل ثغرة ZIP Slip في مدير نسخ احتياطي لـ DevOps. أنشئ أرشيف ZIP خبيث يحتوي على ملفات بأسماء تتضمن اجتياز المسار (مثل "../../var/www/html/shell.php"). عند استخراج ZIP بدون تحقق من المسارات، تُكتب الملفات خارج المجلد الهدف.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'ZIP Slip',
    'Path Traversal',
    'Arbitrary File Write',
    'RCE via File Overwrite',
    'Archive Security',
  ],
  xpReward: 420,
  pointsReward: 210,
  duration: 70,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Create a malicious ZIP containing a file named "../../var/www/html/backdoor.php". When the backup manager extracts it, the webshell lands in the web root. Access the backdoor to read /app/secrets/master_backup.key and get the flag.',
  scenario: {
    context:
      'BackupHub DevOps platform extracts ZIP archives using: entries.forEach(entry => fs.writeFileSync(outputDir + entry.name, entry.data)). If entry.name contains "../", the file is written outside the target directory — classic ZIP Slip vulnerability.',
    vulnerableCode: `// ZIP extraction (vulnerable):
app.post('/backup/restore', (req, res) => {
  const zip = new AdmZip(req.file.buffer);
  zip.getEntries().forEach(entry => {
    const outputPath = path.join('/var/backups/', entry.entryName);
    // ❌ No path check — ZIP Slip!
    fs.writeFileSync(outputPath, entry.getData());
  });
  res.json({ restored: true });
});`,
    exploitation:
      '1. Create ZIP with entry "../../var/www/html/backdoor.php"\n2. Server extracts → writes to /var/www/html/backdoor.php\n3. Access /backdoor.php → RCE',
  },
  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'ZIP Slip: a ZIP entry can have any name including "../". If the server extracts "../../var/www/html/shell.php", it writes OUTSIDE the target directory.',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'POST /backup/upload with zipEntries: [{ "name": "../../var/www/html/backdoor.php", "content": "webshell" }].',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'After extraction, POST /backup/backdoor-exec with { "cmd": "cat /app/secrets/master_backup.key" }.',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'The master_backup.key contains AWS S3 keys + encryption key + FLAG.',
    },
  ],
  flagAnswer: 'FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
  initialState: {
    contents: [
      {
        title: 'MASTER_BACKUP_KEY',
        body: '# BackupHub Master Secrets\nBACKUP_ENCRYPTION_KEY=AES256_BackupHub_Master_2024!\nS3_BUCKET=backuphub-prod-encrypted\nS3_ACCESS_KEY=AKIA_BACKUPHUB_PROD\nS3_SECRET=wJalrX_BackupHub_Secret\nFLAG=FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
