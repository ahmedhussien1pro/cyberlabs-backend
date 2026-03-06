// src/modules/practice-labs/file-inclusion/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab1Metadata: LabMetadata = {
  slug: 'lfi-basic-path-traversal-cms-theme',
  title: 'File Inclusion: Basic LFI — CMS Theme Loader Path Traversal',
  ar_title: 'تضمين الملفات: أساسي — اجتياز المسار في محمّل قوالب CMS',
  description:
    'Exploit a Local File Inclusion vulnerability in a CMS theme loader where the template parameter is passed directly to a file read function without sanitization. Use path traversal (../../) to escape the templates directory and read sensitive system files.',
  ar_description:
    'استغل ثغرة LFI في محمّل قوالب CMS حيث يُمرَّر معامل القالب مباشرة لدالة قراءة الملف بدون تعقيم. استخدم اجتياز المسار (../../) للخروج من مجلد القوالب وقراءة ملفات النظام الحساسة.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Local File Inclusion',
    'Path Traversal',
    'Directory Traversal',
    'File Read',
    'Input Validation Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The CMS loads templates via ?template=default. Traverse the path using ../../ sequences to read /etc/passwd, then read /var/www/cms/config/database.php to find the flag hidden in the DB credentials.',
  scenario: {
    context:
      'PageCraft CMS loads page templates dynamically. The backend reads: fs.readFileSync("/var/www/cms/templates/" + template). No path sanitization is applied. An attacker can traverse the directory tree using "../" sequences to read any file the web server process has access to — including /etc/passwd, application configs, and credential files.',
    vulnerableCode: `// Template loader (vulnerable):
app.get('/page', isAuthenticated, async (req, res) => {
  const { template } = req.query;
  // ❌ Direct path concatenation — no validation!
  const content = fs.readFileSync(
    '/var/www/cms/templates/' + template, 'utf8'
  );
  res.send(content);
});`,
    exploitation:
      'GET /page?template=../../etc/passwd → reads /etc/passwd\nGET /page?template=../../var/www/cms/config/database.php → reads DB config with flag',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try /page/load with { "template": "default" } — works normally. What if you use "../" to go up one directory? What does "../" mean in a file path?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Path traversal: /var/www/cms/templates/ + ../../etc/passwd = /var/www/etc/passwd... that\'s wrong. Count the levels: you need enough "../" to reach root.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'From /var/www/cms/templates/ you need: ../../etc/passwd → /var/www/etc (wrong) or ../../../etc/passwd → /var/etc... Try more levels: ../../../../etc/passwd',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'POST /page/load with { "template": "../../../../etc/passwd" } to read /etc/passwd. Then try { "template": "../../config/database.php" } for the flag.',
    },
  ],
  flagAnswer: 'FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}',
  initialState: {
    contents: [
      {
        title: 'TEMPLATE_DEFAULT',
        body: '<html><body><h1>Welcome to PageCraft CMS</h1><p>Default template loaded.</p></body></html>',
        author: 'template_file',
        isPublic: true,
      },
      {
        title: 'TEMPLATE_ABOUT',
        body: '<html><body><h1>About Us</h1><p>PageCraft — Professional CMS Solution</p></body></html>',
        author: 'template_file',
        isPublic: true,
      },
      {
        title: 'ETC_PASSWD',
        body: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\ncms_user:x:1001:1001:PageCraft CMS:/home/cms_user:/bin/bash',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'DB_CONFIG',
        body: '<?php\n// PageCraft Database Configuration\n$db_host = "db-prod-01.internal";\n$db_user = "pagecraft_admin";\n$db_pass = "PgCr4ft_Pr0d_2024!";\n$db_name = "pagecraft_production";\n// FLAG: FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}\n?>',
        author: 'config_file',
        isPublic: false,
      },
      {
        title: 'ETC_HOSTS',
        body: '127.0.0.1 localhost\n127.0.1.1 pagecraft-prod-01\n172.31.0.1 db-prod-01.internal\n172.31.0.2 redis-prod-01.internal\n172.31.0.3 mail-prod-01.internal',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
