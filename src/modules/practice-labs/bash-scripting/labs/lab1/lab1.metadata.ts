import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'bash-scripting-lab1-base64-decode',
  title: 'Bash Script Base64 Analysis',
  ar_title: 'تحليل سكريبت Bash مشفر بـ Base64',
  description: 'Decode a Base64-encoded bash script to discover the hidden flag inside.',
  ar_description: 'فك تشفير سكريبت Bash مشفر بـ Base64 للكشف عن الفلاج المخفي بداخله.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'Base64', 'Script Analysis', 'Linux'],
  xpReward: 50,
  pointsReward: 50,
  duration: 15,
  isPublished: true,
  imageUrl: null,
  goal: 'Decode the Base64-encoded bash script and find the flag stored in a variable.',
  ar_goal: 'فك تشفير السكريبت المشفر بـ Base64 وأوجد الفلاج المخزن في متغير.',
  flagAnswer: 'FLAG{BASH_BASE64_DECODE_MASTER}',
  briefing: {
    story: 'A suspicious script was found encoded in Base64. Decode it to understand what it does.',
    objective: 'Decode the Base64 string and read the flag from the bash script.',
  },
  stepsOverview: [
    { step: 1, title: 'Get encoded script', description: 'Fetch the Base64-encoded script from /challenge' },
    { step: 2, title: 'Decode', description: 'echo "<b64>" | base64 -d' },
    { step: 3, title: 'Read flag', description: 'Find the key= variable in the decoded script' },
  ],
  solution: {
    summary: 'base64 -d → bash script → key="FLAG{BASH_BASE64_DECODE_MASTER}"',
    steps: [
      'echo "<encodedScript>" | base64 -d',
      'Read: key="FLAG{BASH_BASE64_DECODE_MASTER}"',
      'Submit FLAG{BASH_BASE64_DECODE_MASTER}',
    ],
  },
  postSolve: {
    lesson: 'Base64-encoded scripts are common in malware droppers and CTF challenges. Always decode before executing.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Use: echo "<string>" | base64 -d to decode Base64 in Linux.', xpCost: 5 },
    { order: 2, content: 'The decoded script is a simple bash script with a variable named "key".', xpCost: 10 },
  ],
};
