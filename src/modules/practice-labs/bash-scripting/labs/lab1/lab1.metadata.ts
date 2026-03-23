import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'bash-lab1-base64-script',
  title: 'Bash Script Analysis — Base64 Decode',
  ar_title: 'تحليل سكريبت Bash — فك ترميز Base64',
  description:
    'Analyze a Bash script and trace what the decoded command executes.',
  ar_description: 'حلّل سكريبت Bash وتتبع ما ينفذه الأمر المفكوك ترميزه.',
  difficulty: 'BEGINNER',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'Base64 Decoding', 'Script Analysis', 'Command Tracing'],
  xpReward: 60,
  pointsReward: 60,
  duration: 3600,
  isPublished: true,
  goal: 'Analyze the Bash script and trace what the decoded command executes.',
  ar_goal: 'حلّل سكريبت Bash وتتبع ما ينفذه الأمر المفكوك ترميزه.',
  flagAnswer: 'DYNAMIC',
  briefing: {
    en: "A suspicious script was found encoded in Base64 on a compromised server. Your mission is to decode it and understand what it executes — the flag is embedded inside the script's logic.",
    ar: 'تم العثور على سكريبت مريب مرمَّز بـ Base64 على خادم مخترق. مهمتك هي فك تشفيره وفهم ما ينفذه — الفلاج مضمَّن داخل منطق السكريبت.',
  },
  stepsOverview: {
    en: [
      'You are given an encoded Bash script — figure out what format it uses',
      'Identify the tool needed to reverse the encoding',
      'Decode the script and read its contents carefully',
      'The flag is stored in a variable inside the script — extract it',
    ],
    ar: [
      'لديك سكريبت bash مُرمَّز — اكتشف صيغة الترميز المستخدمة',
      'حدد الأداة اللازمة لعكس الترميز',
      'فك تشفير السكريبت واقرأ محتوياته بعناية',
      'الفلاج محفوظ في متغير داخل السكريبت — استخرجه',
    ],
  },
  solution: {
    context:
      'The Base64-encoded string, when decoded, reveals a Bash script that echoes a dynamic flag stored in a variable.',
    vulnerableCode: 'eval $(echo "ENCODED" | base64 -d)',
    exploitation:
      'echo "<encoded_string>" | base64 -d → reveals: key="FLAG{...}" ; echo $key',
    steps: {
      en: [
        'Call GET /challenge to receive the encoded script',
        "Identify it is Base64 encoded (note the charset and padding '=')",
        'Run: echo "<the_encoded_string>" | base64 -d',
        'Read the decoded script: it assigns the flag to a variable and echoes it',
        'The value of the variable is your flag — submit it',
      ],
      ar: [
        'اطلب GET /challenge للحصول على السكريبت المرمَّز',
        "تعرَّف على ترميز Base64 (لاحظ الأحرف ورمز '=' في النهاية)",
        'نفِّذ: echo "<النص_المرمَّز>" | base64 -d',
        'اقرأ السكريبت المفكوك: يُخصِّص الفلاج لمتغير ثم يطبعه',
        'قيمة المتغير هي الفلاج الخاص بك — أرسله',
      ],
    },
    fix: [
      'Never run eval on Base64-decoded content from untrusted sources.',
      'Sanitize and inspect all encoded data before execution.',
      'Use static analysis tools to scan scripts for obfuscated payloads.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'Base64-encoded scripts are a common obfuscation technique used in malware droppers, phishing payloads, and CTF challenges. Always decode before executing.',
      ar: 'السكريبتات المرمَّزة بـ Base64 هي تقنية تعمية شائعة في ناقلات البرمجيات الخبيثة وتحديات CTF. فكّ الترميز دائماً قبل التنفيذ.',
    },
    impact: {
      en: 'Base64 encoding bypasses simple string-based detection (IDS/AV). It is used extensively in real-world malware and fileless attacks.',
      ar: 'ترميز Base64 يتجاوز أنظمة الكشف البسيطة (IDS/AV). يُستخدم على نطاق واسع في البرمجيات الخبيثة الحقيقية وهجمات بلا ملفات.',
    },
    fix: [
      'Decode and analyze all Base64 content before execution.',
      'Use sandbox environments for unknown or suspicious scripts.',
      'Implement script integrity checks (hash verification).',
    ],
  },
  initialState: {},
  hints: [
    {
      order: 1,
      content:
        "The script uses a common encoding format. Look at the characters — it uses only A-Z, a-z, 0-9, +, / and ends with '='.",
      xpCost: 5,
    },
    {
      order: 2,
      content:
        'The tool you need is a standard Linux command. Think: what command decodes Base64 on the command line?',
      xpCost: 10,
    },
    {
      order: 3,
      content:
        'Pipe the encoded string into the decode command. The output is a bash script — read it and look for a variable that holds the flag.',
      xpCost: 15,
    },
  ],
};
