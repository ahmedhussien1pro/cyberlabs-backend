// src/modules/practice-labs/file-inclusion/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  // محاكاة نظام الملفات
  private readonly virtualFS: Record<string, string> = {
    // templates — المسار الطبيعي
    '/var/www/cms/templates/default':
      '<html><body><h1>Welcome to PageCraft CMS</h1></body></html>',
    '/var/www/cms/templates/about':
      '<html><body><h1>About Us</h1></body></html>',
    '/var/www/cms/templates/contact':
      '<html><body><h1>Contact Us</h1></body></html>',
    // ملفات حساسة — خارج templates
    '/etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\ncms_user:x:1001:1001:PageCraft CMS:/home/cms_user:/bin/bash',
    '/etc/hosts':
      '127.0.0.1 localhost\n172.31.0.1 db-prod-01.internal\n172.31.0.2 redis-prod-01.internal',
    '/var/www/cms/config/database.php':
      '<?php\n$db_host = "db-prod-01.internal";\n$db_user = "pagecraft_admin";\n$db_pass = "PgCr4ft_Pr0d_2024!";\n$db_name = "pagecraft_production";\n// FLAG: FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}\n?>',
    '/var/www/cms/config/app.php':
      '<?php\n$app_key = "base64:xK9mPqR7vT2wNjHsLdYuZcBgFnEiOaXe";\n$debug = false;\n$env = "production";\n?>',
    '/proc/self/environ':
      'APACHE_RUN_USER=www-data\nAPACHE_RUN_GROUP=www-data\nDB_PASS=PgCr4ft_Pr0d_2024!\nAPP_KEY=xK9mPqR7vT2wNjHsLdYuZcBgFnEiOaXe',
  };

  private readonly BASE_PATH = '/var/www/cms/templates/';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async listTemplates(userId: string, labId: string) {
    return {
      success: true,
      templates: ['default', 'about', 'contact', 'blog', 'portfolio'],
      usage: 'POST /page/load with { "template": "default" }',
      note: 'Load any CMS page template by name.',
    };
  }

  // ❌ الثغرة: path traversal بدون sanitization
  async loadPage(userId: string, labId: string, template: string) {
    if (!template) throw new BadRequestException('template is required');

    // ❌ الثغرة: concatenation مباشرة بدون path resolution
    const resolvedPath = this.resolvePath(this.BASE_PATH, template);
    const isTraversal = this.detectTraversal(template);

    const fileContent = this.virtualFS[resolvedPath];
    const hasFlag = fileContent?.includes('FLAG{') || false;

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'LFI',
        action: 'TEMPLATE_LOAD',
        meta: { template, resolvedPath, isTraversal, hasFlag },
      },
    });

    if (!fileContent) {
      return {
        success: false,
        error: 'File not found',
        requestedPath: resolvedPath,
        hint: isTraversal
          ? `Traversal detected! Resolved to: ${resolvedPath} — try more or fewer "../" levels`
          : 'Template not found. Try "default", "about", or use path traversal.',
      };
    }

    return {
      success: true,
      exploited: hasFlag,
      template,
      resolvedPath,
      content: fileContent,
      isTraversal,
      ...(hasFlag && {
        flag: 'FLAG{LFI_BASIC_PATH_TRAVERSAL_CMS_TEMPLATE_DB_CONFIG}',
        vulnerability:
          'Local File Inclusion — Path Traversal (Directory Traversal)',
        impact:
          'Attacker read DB credentials, app secrets, and system user accounts.',
        fix: [
          'Resolve and validate path: use path.resolve() then verify it starts with BASE_PATH',
          'Whitelist allowed template names — reject anything not in the list',
          'Never use user input directly in file path construction',
          'Use basename() to strip directory components from user input',
        ],
      }),
      ...(isTraversal &&
        !hasFlag && {
          hint: `Good traversal attempt! Resolved to: ${resolvedPath}\nTry: "../../config/database.php" for the DB config with the flag.`,
        }),
    };
  }

  // ❌ الثغرة: محاكاة path join بدون normalization
  private resolvePath(base: string, input: string): string {
    const parts = (base + input).split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.') {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  }

  private detectTraversal(input: string): boolean {
    return (
      input.includes('../') ||
      input.includes('..\\') ||
      input.includes('%2e%2e')
    );
  }
}
