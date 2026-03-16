import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'bash-lab1-base64-script',
  title: 'Bash Script Analysis — Base64 Decode',
  ar_title: 'تحليل سكريبت Bash — فك ترميز Base64',
  description: 'Analyze a Bash script and trace what the decoded command executes.',
  ar_description: 'حلّل سكريبت Bash وتتبع ما ينفذه الأمر المفكوك ترميزه.',
  difficulty: 'BEGINNER',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'Base64 Decoding', 'Script Analysis', 'Command Tracing'],
  xpReward: 60,
  pointsReward: 60,
  duration: 20,
  isPublished: true,
  goal: 'Analyze the Bash script and trace what the decoded command executes.',
  ar_goal: 'حلّل سكريبت Bash وتتبع ما ينفذه الأمر المفكوك ترميزه.',
  flagAnswer: 'FLAG{BASH_BASE64_SCRIPT_DECODED}',
  briefing: {
    en: 'A suspicious script was found encoded in Base64. Decode it to understand what it does.',
    ar: 'تم العثور على سكريبت مريب مرمَّز بـ Base64. فك تشفيره لفهم ما يفعله.',
  },
  stepsOverview: {
    en: [
      'Read the Bash script carefully',
      'Extract the Base64-encoded string',
      'Decode: echo "BASE64" | base64 -d',
      'Trace what the decoded command outputs → find the flag',
    ],
    ar: [
      'اقرأ سكريبت Bash بعناية',
      'استخرج النص المرمَّز بـ Base64',
      'فك الترميز: echo "BASE64" | base64 -d',
      'تتبع ما يخرجه الأمر المفكوك ترميزه → ابحث عن الفلاج',
    ],
  },
  solution: {
    context: 'Script runs: eval $(echo BASE64_STRING | base64 -d). Decode to see what gets executed.',
    vulnerableCode: 'eval $(echo "ENCODED" | base64 -d)',
    exploitation: 'echo "ENCODED" | base64 -d → reveals echo FLAG{...}',
    steps: {
      en: [
        'Extract the Base64 string from the script',
        'echo "BASE64" | base64 -d → decoded command',
        'Read the output → FLAG{BASH_BASE64_SCRIPT_DECODED}',
      ],
      ar: [
        'استخرج نص Base64 من السكريبت',
        'echo "BASE64" | base64 -d → الأمر المفكوك ترميزه',
        'اقرأ الناتج → FLAG{BASH_BASE64_SCRIPT_DECODED}',
      ],
    },
    fix: ['Never run eval on Base64-decoded content from untrusted sources.'],
  },
  postSolve: {
    explanation: {
      en: 'Base64-encoded scripts are common in malware droppers and CTF challenges. Always decode before executing.',
      ar: 'السكريبتات المرمَّزة بـ Base64 شائعة في ناقلات البرمجيات الخبيثة وتحديات CTF. فكّ الترميز دائماً قبل التنفيذ.',
    },
    impact: {
      en: 'Base64 encoding bypasses simple string-based detection. Used extensively in real malware.',
      ar: 'ترميز Base64 يتجاوز الكشف البسيط المبني على النصوص. يُستخدم على نطاق واسع في البرمجيات الخبيثة الحقيقية.',
    },
    fix: ['Decode and analyze all Base64 content before execution.', 'Use sandbox environments for unknown scripts.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'The script uses eval and Base64. Find the encoded string.', xpCost: 5 },
    { order: 2, content: 'Run: echo "THE_STRING" | base64 -d to decode it.', xpCost: 10 },
    { order: 3, content: 'The decoded output contains the flag directly.', xpCost: 15 },
  ],
};
