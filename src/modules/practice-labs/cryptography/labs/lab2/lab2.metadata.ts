import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'cryptography-lab2-xor-base64',
  title: 'XOR + Base64 Multi-Layer Decode',
  ar_title: 'فك تشفير XOR و Base64 متعدد الطبقات',
  description: 'Reverse a two-layer encoding: Base64 on top of XOR. Brute-force the single-byte XOR key.',
  ar_description: 'اعكس تشفيرًا من طبقتين: Base64 فوق XOR. أوجد مفتاح XOR بالـ brute-force.',
  difficulty: 'BEGINNER',
  category: 'CRYPTOGRAPHY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cryptography', 'XOR', 'Base64', 'Brute Force'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Decode Base64 first, then XOR-decrypt with the correct single-byte key to get the flag.',
  ar_goal: 'افك Base64 أولاً، ثم فك تشفير XOR بالمفتاح الصحيح للحصول على الفلاج.',
  flagAnswer: 'FLAG{XOR_AND_BASE64_DECODED}',
  briefing: {
    story: 'Malware author used a two-layer obfuscation scheme. Your job is to reverse it.',
    objective: 'Decode Base64, then brute-force the XOR key (1–100).',
  },
  stepsOverview: [
    { step: 1, title: 'Fetch challenge', description: 'Get the Base64-encoded ciphertext' },
    { step: 2, title: 'Decode Base64', description: 'Convert Base64 to raw bytes' },
    { step: 3, title: 'Brute-force XOR', description: 'Try all keys 1–100 until you get readable text' },
    { step: 4, title: 'Submit', description: 'Submit the decrypted flag as FLAG{...}' },
  ],
  solution: {
    summary: 'Decode Base64 → brute force XOR key 42 → plaintext flag.',
    steps: ['base64_decode(ciphertext) → raw_bytes', 'For key in 1..100: raw_bytes XOR key', 'Find key producing readable ASCII'],
  },
  postSolve: {
    lesson: 'Single-byte XOR with Base64 is trivially broken. Real encryption requires secure algorithms like AES.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Decode Base64 first to get raw bytes.', xpCost: 5 },
    { order: 2, content: 'XOR key is a single byte. Try all values 1–100.', xpCost: 10 },
    { order: 3, content: 'Readable ASCII output means you found the correct key.', xpCost: 15 },
  ],
};
