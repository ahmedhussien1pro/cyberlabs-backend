// src/modules/practice-labs/file-inclusion/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  // محاكاة Apache access.log — قابل للتسميم
  private accessLog: string[] = [
    '192.168.1.100 - - [05/Mar/2026:20:00:01 +0000] "GET / HTTP/1.1" 200 2326 "Mozilla/5.0 (Windows NT 10.0)"',
    '192.168.1.101 - - [05/Mar/2026:20:01:15 +0000] "GET /about HTTP/1.1" 200 1024 "Mozilla/5.0 (X11; Linux x86_64)"',
  ];

  private isLogPoisoned = false;

  private readonly virtualFS: Record<string, string> = {
    '/var/www/html/pages/home': '<h1>Welcome to ViewerX</h1>',
    '/var/www/html/pages/about':
      '<h1>About ViewerX</h1><p>The best document viewer.</p>',
    '/var/www/html/pages/contact': '<h1>Contact Us</h1>',
    '/var/www/html/secret.txt':
      'Server Admin Credentials\n========================\nAdmin Panel: https://viewerx-admin.io/panel\nUsername: admin@viewerx.io\nPassword: V13w3rX_ADM1N_2024!\n\nFLAG: FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
    '/etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
  };

  private readonly cmdOutputs: Record<string, string> = {
    'cat /var/www/html/secret.txt':
      'Server Admin Credentials\n========================\nAdmin Panel: https://viewerx-admin.io/panel\nUsername: admin@viewerx.io\nPassword: V13w3rX_ADM1N_2024!\n\nFLAG: FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    'ls /': 'bin\netc\nhome\nopt\ntmp\nusr\nvar\nwww',
    'ls /var/www/html': 'index.php\nconfig.php\nsecret.txt\npages\nuploads',
    'cat /etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.accessLog = [
      '192.168.1.100 - - [05/Mar/2026:20:00:01 +0000] "GET / HTTP/1.1" 200 2326 "Mozilla/5.0 (Windows NT 10.0)"',
      '192.168.1.101 - - [05/Mar/2026:20:01:15 +0000] "GET /about HTTP/1.1" 200 1024 "Mozilla/5.0 (X11; Linux x86_64)"',
    ];
    this.isLogPoisoned = false;
    return this.stateService.initializeState(userId, labId);
  }

  // Step 1: تسميم السجل
  async poisonLog(
    userId: string,
    labId: string,
    userAgent: string,
    path: string,
  ) {
    if (!userAgent) throw new BadRequestException('userAgent is required');

    const requestPath = path ?? '/';
    const timestamp = new Date()
      .toISOString()
      .replace('T', ':')
      .replace('Z', '');
    const logEntry = `10.0.0.1 - - [${timestamp}] "GET ${requestPath} HTTP/1.1" 200 - "${userAgent}"`;

    // Apache يكتب الـ User-Agent بدون sanitization
    this.accessLog.push(logEntry);

    const containsPhp = /<\?php/.test(userAgent);
    if (containsPhp) this.isLogPoisoned = true;

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LFI',
        action: 'LOG_POISON',
        meta: { userAgent, containsPhp, logEntry },
      },
    });

    return {
      success: true,
      logEntry,
      containsPhp,
      ...(containsPhp
        ? {
            message:
              '✅ PHP code written to access.log! Now use LFI to include the log file.',
            nextStep:
              'POST /page/view with { "page": "../../../../var/log/apache2/access.log", "cmd": "cat /var/www/html/secret.txt" }',
          }
        : {
            message: 'Request logged to access.log.',
            hint: 'Try injecting PHP code in the userAgent: "<?php system($cmd); ?>"',
          }),
    };
  }

  async viewRawLog(userId: string, labId: string) {
    return {
      success: true,
      logPath: '/var/log/apache2/access.log',
      isPoisoned: this.isLogPoisoned,
      entries: this.accessLog.length,
      log: this.accessLog.join('\n'),
    };
  }

  // Step 2: ❌ الثغرة — LFI يُشغّل الكود المحقون في السجل
  async viewPage(userId: string, labId: string, page: string, cmd: string) {
    if (!page) throw new BadRequestException('page parameter is required');

    const isTraversal = page.includes('../');
    const isLogFile = page.includes('access.log') || page.includes('/var/log/');

    let content = '';
    let isExploited = false;

    if (isLogFile && this.isLogPoisoned) {
      // ❌ الثغرة: السجل المسموم يُنفَّذ كـ PHP
      const rawLog = this.accessLog.join('\n');

      if (cmd) {
        // محاكاة تنفيذ PHP system() مع الـ cmd
        const cmdOutput = this.cmdOutputs[cmd] || `(executed: ${cmd})`;
        const hasFlag = cmdOutput.includes('FLAG{');
        isExploited = hasFlag;

        content = rawLog.replace(
          /(<\?php[^?]*\?>)/g,
          `[PHP EXECUTED — output: ${cmdOutput}]`,
        );

        await this.prisma.labGenericLog.create({
          data: {
            userId,
            labId,
            type: 'LFI',
            action: 'LOG_POISON_RCE',
            meta: {
              page,
              cmd,
              cmdOutput: cmdOutput.substring(0, 200),
              hasFlag,
            },
          },
        });

        return {
          success: true,
          exploited: isExploited,
          phpExecuted: true,
          cmd,
          cmdOutput,
          logContent: content,
          ...(isExploited && {
            flag: 'FLAG{LFI_LOG_POISONING_APACHE_RCE_PHP_INJECTION}',
            vulnerability: 'LFI + Log Poisoning → Remote Code Execution',
            attackChain: [
              '1. Injected PHP code into Apache access.log via User-Agent header',
              '2. Used LFI to include /var/log/apache2/access.log',
              '3. PHP interpreter executed the injected <?php system() ?> code',
              '4. Achieved RCE — read secret.txt containing admin credentials and flag',
            ],
            impact:
              'Full RCE on web server. Admin credentials exposed. Complete system compromise.',
            fix: [
              'Resolve and validate file paths — ensure they stay within allowed directories',
              'Disable PHP log file inclusion: never include /var/log/ paths',
              'Sanitize/encode User-Agent and all logged values before writing to disk',
              'Use a WAF to strip PHP tags from HTTP headers',
              'Run web app in read-only filesystem where possible',
            ],
          }),
        };
      }

      content = rawLog;
      return {
        success: true,
        exploited: false,
        phpExecuted: false,
        logContent: content,
        hint: 'Log file included! PHP code visible. Add "cmd" parameter to execute it: { "cmd": "cat /var/www/html/secret.txt" }',
      };
    }

    // قراءة ملفات عادية
    if (isTraversal) {
      const resolvedPath = this.resolvePath('/var/www/html/pages/', page);
      content = this.virtualFS[resolvedPath] ?? 'File not found';
      isExploited = content.includes('FLAG{');
    } else {
      content =
        this.virtualFS[`/var/www/html/pages/${page}`] ?? 'Page not found';
    }

    return {
      success: true,
      exploited: isExploited,
      page,
      content,
      ...(isTraversal &&
        !isLogFile && {
          hint: this.isLogPoisoned
            ? 'Traversal works! Now target the poisoned log: page: "../../../../var/log/apache2/access.log"'
            : 'Traversal works! But log not yet poisoned. First POST /log/poison with PHP code in userAgent.',
        }),
    };
  }

  private resolvePath(base: string, input: string): string {
    const parts = (base + input).split('/').filter(Boolean);
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '..') stack.pop();
      else if (p !== '.') stack.push(p);
    }
    return '/' + stack.join('/');
  }
}
