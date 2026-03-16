import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'obfuscation-lab2-python-eval',
  title: 'Python Eval Obfuscation',
  ar_title: 'تشويش Python بـ eval',
  description: 'Trace string reversal + Base64 decode to find what the script executes.',
  ar_description: 'تتبع عكس النص + فك ترميز Base64 لاكتشاف ما ينفذه السكريبت.',
  difficulty: 'BEGINNER',
  category: 'TOOLS_AND_TECHNIQUES',
  executionMode: 'SHARED_BACKEND',
  skills: ['Python', 'Base64 Decoding', 'Eval Analysis', 'Code Tracing'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  goal: 'Trace string reversal + Base64 decode to find what the script executes.',
  ar_goal: 'تتبع عكس النص + فك ترميز Base64 لمعرفة ما ينفذه السكريبت.',
  flagAnswer: 'FLAG{OBFUSCATION_PYTHON_EVAL_REVERSED}',
  briefing: {
    en: 'A malware sample uses eval-based obfuscation to hide its payload. Analyze it without running it.',
    ar: 'عينة برمجيات خبيثة تستخدم تشويشاً مبنياً على eval لإخفاء حمولتها. حللها دون تشغيلها.',
  },
  stepsOverview: {
    en: [
      'Examine the Python script with eval()',
      'Extract the obfuscated string',
      'Reverse the string: _x[::-1]',
      'base64.b64decode the result → read the flag',
    ],
    ar: [
      'افحص سكريبت Python مع eval()',
      'استخرج النص المشوَّش',
      'اعكس النص: _x[::-1]',
      'base64.b64decode النتيجة → اقرأ الفلاج',
    ],
  },
  solution: {
    context: 'Python eval with reversed Base64 string. Reverse then decode to get the hidden payload.',
    vulnerableCode: 'eval(base64.b64decode(_x[::-1]))',
    exploitation: 'Reverse the string manually then base64 decode → reveals flag.',
    steps: {
      en: [
        'Reverse the string _x[::-1]',
        'base64.b64decode → original source code',
        'Read the flag from the print statement',
      ],
      ar: [
        'اعكس النص _x[::-1]',
        'base64.b64decode → الكود الأصلي',
        'اقرأ الفلاج من عبارة print',
      ],
    },
    fix: ['Never run eval on unknown input.', 'Use static analysis tools to detect eval-based obfuscation.'],
  },
  postSolve: {
    explanation: {
      en: 'Never run eval-based code. Always analyze statically first using AST or manual tracing.',
      ar: 'لا تشغّل أبداً كوداً مبنياً على eval. حلّله دائماً بشكل ساكن أولاً باستخدام AST أو التتبع اليدوي.',
    },
    impact: {
      en: 'Eval obfuscation is used in phishing droppers and script-based malware. Trivially reversed.',
      ar: 'يُستخدم تشويش eval في ناقلات التصيد والبرمجيات الخبيثة المبنية على السكريبت. يُعكس بتفاهة.',
    },
    fix: ['Disable eval in production environments.', 'Use linters (ESLint/bandit) to detect eval usage.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'The script uses eval(). Trace what string gets passed to it.', xpCost: 5 },
    { order: 2, content: 'The string is reversed. Apply [::-1] to get the Base64.', xpCost: 10 },
    { order: 3, content: 'base64.b64decode the reversed string to see the original code.', xpCost: 15 },
  ],
};
