import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'cryptography-lab2-xor-base64',
  title: 'XOR + Base64 Multi-Layer Decode',
  ar_title: 'فك تشفير متعدد الطبقات XOR + Base64',
  description: 'Reverse a Base64 + XOR encoding scheme to recover the hidden flag.',
  ar_description: 'اعكس مخطط ترميز Base64 + XOR لاسترداد الفلاج المخفي.',
  difficulty: 'BEGINNER',
  category: 'CRYPTOGRAPHY',
  executionMode: 'SHARED_BACKEND',
  skills: ['XOR Cipher', 'Base64 Decoding', 'Multi-layer Encoding'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  goal: 'Reverse a Base64 + XOR encoding to recover the flag.',
  ar_goal: 'اعكس ترميز Base64 + XOR لاسترداد الفلاج.',
  flagAnswer: 'FLAG{XOR_B64_MULTI_LAYER_DECODED}',
  briefing: {
    en: 'Malware author used a two-layer obfuscation scheme. Your job is to reverse it.',
    ar: 'استخدم مؤلف البرمجيات الخبيثة مخطط تشويش ثنائي الطبقة. مهمتك هي عكسه.',
  },
  stepsOverview: {
    en: [
      'base64_decode(ciphertext) → raw bytes',
      'XOR each byte with a key (1–100) until readable ASCII',
      'Submit FLAG{DECODED_TEXT}',
    ],
    ar: [
      'base64_decode(ciphertext) → bytes خام',
      'XOR كل byte مع مفتاح (1–100) حتى تحصل على ASCII مقروء',
      'أرسل FLAG{DECODED_TEXT}',
    ],
  },
  solution: {
    context: 'Two-layer encoding: XOR with single byte key then Base64. Brute-force the key.',
    vulnerableCode: 'N/A — Cryptography challenge',
    exploitation: 'base64_decode → XOR brute-force 1..100 → readable flag.',
    steps: {
      en: [
        'base64_decode(ciphertext) → raw_bytes',
        'For key in 1..100: raw_bytes XOR key',
        'Find key producing readable ASCII',
      ],
      ar: [
        'base64_decode(ciphertext) → raw_bytes',
        'لكل مفتاح في 1..100: raw_bytes XOR key',
        'ابحث عن المفتاح المنتج لـ ASCII مقروء',
      ],
    },
    fix: ['N/A — CTF challenge'],
  },
  postSolve: {
    explanation: {
      en: 'Single-byte XOR with Base64 is trivially broken. Real encryption requires secure algorithms like AES.',
      ar: 'XOR أحادي البايت مع Base64 يُكسر بتفاهة. التشفير الحقيقي يتطلب خوارزميات آمنة مثل AES.',
    },
    impact: {
      en: 'Malware using weak encoding is easily reversed by security analysts.',
      ar: 'البرمجيات الخبيثة التي تستخدم ترميزاً ضعيفاً يسهل عكسها من قِبَل المحللين الأمنيين.',
    },
    fix: ['Use AES-256-GCM for confidentiality. Never rely on XOR or Base64 as security.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'The ciphertext is Base64 encoded. Decode it first.', xpCost: 5 },
    { order: 2, content: 'After decoding, XOR each byte with a single integer key (1–100).', xpCost: 10 },
    { order: 3, content: 'The correct key produces readable ASCII text that looks like a flag.', xpCost: 15 },
  ],
};
