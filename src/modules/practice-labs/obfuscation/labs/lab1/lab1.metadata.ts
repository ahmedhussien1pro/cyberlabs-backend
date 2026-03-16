import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'obfuscation-lab1-js-hex-decode',
  title: 'JavaScript Hex Obfuscation',
  ar_title: 'فك تعتيم JavaScript بالـ Hex',
  description: 'Deobfuscate JavaScript code using hex-encoded strings to find the hidden password.',
  ar_description: 'فك تعتيم كود JavaScript يستخدم hex strings مخفية لإيجاد الباسورد المخفي.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Obfuscation', 'JavaScript', 'Reverse Engineering', 'Hex Decoding'],
  xpReward: 60,
  pointsReward: 60,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Decode the hex strings in the obfuscated JS code to find the password and submit as FLAG{password}.',
  ar_goal: 'فك تشفير الـ hex strings في كود JS لإيجاد الباسورد وإرساله كـ FLAG{password}.',
  flagAnswer: 'FLAG{s3cr3t_0bfusc4t3d}',
  briefing: {
    story: 'A suspicious web app has client-side authentication logic. The code is obfuscated but the password is inside.',
    objective: 'Decode the hex strings and trace variable assignments to find the password.',
  },
  stepsOverview: [
    { step: 1, title: 'Get code', description: 'Fetch the obfuscated JS from /challenge' },
    { step: 2, title: 'Decode hex', description: 'Convert \\xNN escape sequences to ASCII' },
    { step: 3, title: 'Trace logic', description: 'Follow variable assignments to find password value' },
    { step: 4, title: 'Submit', description: 'Submit as FLAG{password}' },
  ],
  solution: {
    summary: 'Decode all \\xNN sequences → trace array assignments → password = "s3cr3t_0bfusc4t3d".',
    steps: ['Decode \\x73\\x33\\x63\\x72... → "s3cr3t_0bfusc4t3d"', 'Submit FLAG{s3cr3t_0bfusc4t3d}'],
  },
  postSolve: {
    lesson: 'JS obfuscation is security by obscurity. Tools like de4js, jsnice.org, and AST parsers automate deobfuscation.',
  },
  initialState: {},
  hints: [
    { order: 1, content: '\\x73 = "s", \\x33 = "3" in ASCII hex encoding.', xpCost: 5 },
    { order: 2, content: 'Use Python: bytes.fromhex("733363723374").decode() or an online hex decoder.', xpCost: 10 },
    { order: 3, content: 'The password is "s3cr3t_0bfusc4t3d".', xpCost: 20 },
  ],
};
