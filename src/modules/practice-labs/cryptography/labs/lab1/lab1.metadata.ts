import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'cryptography-lab1-caesar-cipher',
  title: 'Caesar Cipher Cracking',
  ar_title: 'كسر تشفير قيصر',
  description: 'Decode a ROT13-encrypted flag by reversing the Caesar cipher shift.',
  ar_description: 'فك تشفير نص مشفر بـ ROT13 عن طريق عكس إزاحة شفرة قيصر.',
  difficulty: 'BEGINNER',
  category: 'CRYPTOGRAPHY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cryptography', 'Caesar Cipher', 'ROT13'],
  xpReward: 50,
  pointsReward: 50,
  duration: 15,
  isPublished: true,
  imageUrl: null,
  goal: 'Decode the ROT13-encrypted string and retrieve the hidden flag.',
  ar_goal: 'فك تشفير النص المشفر بـ ROT13 واسترجاع الفلاج المخفي.',
  flagAnswer: 'FLAG{FLAG_CRYPTO_CAESAR_CRACKED}',
  briefing: {
    story: 'You intercepted an encrypted message. The encryption looks like a simple letter substitution.',
    objective: 'Decode the ciphertext to reveal the flag.',
  },
  stepsOverview: [
    { step: 1, title: 'Get the challenge', description: 'Fetch the encrypted string from /challenge' },
    { step: 2, title: 'Identify the cipher', description: 'Recognize ROT13 / Caesar cipher pattern' },
    { step: 3, title: 'Decode and submit', description: 'Apply reverse shift and submit FLAG{...}' },
  ],
  solution: {
    summary: 'ROT13 shifts each letter by 13. Apply the same shift again to decode.',
    steps: ['Note the ciphertext', 'Apply ROT13 (shift -13 or +13)', 'Submit the result as FLAG{...}'],
  },
  postSolve: {
    lesson: 'Caesar cipher is monoalphabetic and easily broken by frequency analysis or brute-force (26 possibilities).',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Each letter is shifted by the same fixed amount.', xpCost: 5 },
    { order: 2, content: 'ROT13 is a special Caesar cipher where shift = 13.', xpCost: 10 },
    { order: 3, content: 'Apply ROT13 to each letter: A↔N, B↔O, ...', xpCost: 15 },
  ],
};
