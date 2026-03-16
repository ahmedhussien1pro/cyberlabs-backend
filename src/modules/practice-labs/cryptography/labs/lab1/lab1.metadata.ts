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
  goal: 'Decode the ROT13-encrypted string and retrieve the hidden flag.',
  ar_goal: 'فك تشفير النص المشفر بـ ROT13 واسترجاع الفلاج المخفي.',
  flagAnswer: 'FLAG{FLAG_CRYPTO_CAESAR_CRACKED}',
  briefing: {
    en: 'You intercepted an encrypted message. The encryption looks like a simple letter substitution.',
    ar: 'اعترضت رسالة مشفرة. يبدو التشفير كاستبدال بسيط للحروف.',
  },
  stepsOverview: {
    en: [
      'Fetch the encrypted string from /challenge',
      'Recognize ROT13 / Caesar cipher pattern',
      'Apply reverse shift and submit FLAG{...}',
    ],
    ar: [
      'احضر النص المشفر من /challenge',
      'تعرف على نمط ROT13 / شفرة قيصر',
      'طبّق الإزاحة العكسية وأرسل FLAG{...}',
    ],
  },
  solution: {
    context: 'ROT13 shifts each letter by 13. Apply the same shift again to decode.',
    vulnerableCode: 'N/A — Cryptography challenge',
    exploitation: 'Apply ROT13 to the ciphertext. Each letter shifts by 13 positions.',
    steps: {
      en: ['Note the ciphertext', 'Apply ROT13 (shift -13 or +13)', 'Submit the result as FLAG{...}'],
      ar: ['لاحظ النص المشفر', 'طبّق ROT13 (إزاحة -13 أو +13)', 'أرسل النتيجة كـ FLAG{...}'],
    },
    fix: ['N/A — CTF challenge'],
  },
  postSolve: {
    explanation: {
      en: 'Caesar cipher is monoalphabetic and easily broken by frequency analysis or brute-force (26 possibilities).',
      ar: 'شفرة قيصر أحادية الأبجدية وتُكسر بسهولة بالتحليل التكراري أو القوة الغاشمة (26 احتمالاً).',
    },
    impact: {
      en: 'Simple substitution ciphers provide no real security in modern contexts.',
      ar: 'شفرات الاستبدال البسيطة لا توفر أماناً حقيقياً في السياقات الحديثة.',
    },
    fix: ['Use AES-256 or RSA-2048+ for real encryption needs.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Each letter is shifted by the same fixed amount.', xpCost: 5 },
    { order: 2, content: 'ROT13 is a special Caesar cipher where shift = 13.', xpCost: 10 },
    { order: 3, content: 'Apply ROT13 to each letter: A↔N, B↔O, ...', xpCost: 15 },
  ],
};
