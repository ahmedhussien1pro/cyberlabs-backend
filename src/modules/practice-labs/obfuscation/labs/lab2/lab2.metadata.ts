import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'obfuscation-lab2-python-eval',
  title: 'Python Eval Obfuscation',
  ar_title: 'فك تعتيم Python بالـ eval',
  description: 'Trace a Python script that uses eval + base64 + string reversal to hide its output.',
  ar_description: 'تتبع سكريبت Python يستخدم eval وBase64 وعكس النص لإخفاء مخرجاته.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Obfuscation', 'Python', 'Base64', 'Reverse Engineering'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Manually trace the Python obfuscation layers (string reversal + Base64) to find the flag.',
  ar_goal: 'تتبع طبقات التعتيم يدوياً (عكس النص + Base64) للعثور على الفلاج.',
  flagAnswer: 'FLAG{PYTHON_EVAL_OBFUSCATION_CRACKED}',
  briefing: {
    story: 'A malware sample uses eval-based obfuscation to hide its payload. Analyze it without running it.',
    objective: 'Reverse the obfuscation and find what the script actually executes.',
  },
  stepsOverview: [
    { step: 1, title: 'Fetch code', description: 'Get the obfuscated Python script' },
    { step: 2, title: 'Reverse string', description: 'Apply _x[::-1] to reverse the string' },
    { step: 3, title: 'Decode Base64', description: 'base64.b64decode the reversed string' },
    { step: 4, title: 'Read output', description: 'The decoded string reveals the flag' },
  ],
  solution: {
    summary: 'Reverse _x → decode Base64 → get print("FLAG{...}").',
    steps: ['Reverse the string', 'base64.b64decode → original source code', 'Read the flag from the print statement'],
  },
  postSolve: {
    lesson: 'Never run unknown eval-based code. Always analyze statically first using AST or manual tracing.',
  },
  initialState: {},
  hints: [
    { order: 1, content: '_x[::-1] reverses a string in Python.', xpCost: 5 },
    { order: 2, content: 'After reversing, base64.b64decode() gives you the original code.', xpCost: 10 },
    { order: 3, content: 'The original code contains a print statement with the flag.', xpCost: 15 },
  ],
};
