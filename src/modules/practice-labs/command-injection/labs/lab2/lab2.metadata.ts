// src/modules/practice-labs/command-injection/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab2Metadata: LabMetadata = {
  slug: 'cmdi-blind-time-based-file-converter',
  title: 'Command Injection: Blind Time-Based — File Format Converter',
  ar_title: 'حقن الأوامر: أعمى زمني — محول صيغ الملفات',
  description:
    'Exploit a blind command injection vulnerability in a file conversion service. The server executes a conversion command but never returns command output. Use time-based techniques (sleep) to confirm injection, then exfiltrate the flag by encoding it in response timing.',
  ar_description:
    'استغل ثغرة حقن أوامر عمياء في خدمة تحويل الملفات. الخادم ينفذ أمر التحويل لكن لا يُعيد أبداً ناتج الأوامر. استخدم تقنيات زمنية (sleep) لتأكيد الحقن ثم سرب العلم عبر ترميزه في توقيت الاستجابة.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Blind Command Injection',
    'Time-Based Detection',
    'Out-of-Band Techniques',
    'File Processing Security',
  ],
  xpReward: 250,
  pointsReward: 125,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The file converter runs a shell command but never shows its output. Confirm blind injection using sleep commands. Then use the /cmdi/read-file endpoint to exfiltrate /app/config/secret.key from the server.',
  scenario: {
    context:
      'ConvertX is a file format conversion SaaS. The backend runs: exec("convert input." + format + " output.pdf"). The "format" parameter is injected into the command. The server returns only "conversion complete" — never the command output (blind). Attackers must use time-based probing (sleep 5) to confirm injection, then use out-of-band channels to exfiltrate data.',
    vulnerableCode: `// File converter (vulnerable — blind):
app.post('/convert', isAuthenticated, async (req, res) => {
  const { filename, format } = req.body;
  // ❌ format injected into command — output never returned!
  await exec(\`convert \${filename}.\${format} output.pdf\`);
  res.json({ success: true, message: 'Conversion complete' }); // Blind!
});`,
    exploitation:
      '1. Send format: "png; sleep 5" — if response takes 5+ seconds, injection confirmed. 2. Use /cmdi/read-file with injected path to retrieve secret file contents.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The server never shows command output. Try format: "png; sleep 5" and measure the response time. Did it take 5 seconds? That confirms injection.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        "Blind injection confirmed. You can't see output directly. Use the /cmdi/read-file simulation to read files via injected commands.",
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /convert with { "filename": "document", "format": "png; cat /app/config/secret.key > /tmp/out.txt" }. Then POST /cmdi/read-file with { "path": "/tmp/out.txt" }.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Use /cmdi/simulate-oob with { "filename": "doc", "format": "png", "injectCmd": "cat /app/config/secret.key" } to simulate OOB data exfiltration.',
    },
  ],
  flagAnswer: 'FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}',
  initialState: {
    contents: [
      {
        title: 'SECRET_KEY',
        body: JSON.stringify({
          path: '/app/config/secret.key',
          content:
            'APP_SECRET=FLAG{CMDI_BLIND_TIME_BASED_FILE_CONVERTER_OOB}\nDB_URL=postgresql://prod:s3cr3t@db:5432/convertx\nAWS_KEY=AKIA_PROD_XYZ789',
        }),
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'TMP_OUTPUT',
        body: JSON.stringify({ path: '/tmp/out.txt', content: '' }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
