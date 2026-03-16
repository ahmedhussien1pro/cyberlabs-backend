import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  slug: 'cryptography-lab3-rsa-weak-key',
  title: 'RSA Weak Key Attack',
  ar_title: 'هجوم المفتاح الضعيف RSA',
  description: 'Factor n=3233 into p and q, compute private key d, and decrypt ciphertext=2790.',
  ar_description: 'حلّل n=3233 إلى p و q، احسب المفتاح الخاص d، وافك تشفير ciphertext=2790.',
  difficulty: 'INTERMEDIATE',
  category: 'CRYPTOGRAPHY',
  executionMode: 'SHARED_BACKEND',
  skills: ['RSA', 'Prime Factorization', 'Modular Arithmetic'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  goal: 'Factor n=3233 into p and q, compute private key d, and decrypt ciphertext=2790.',
  ar_goal: 'حلّل n=3233 إلى p و q، احسب d، وافك تشفير 2790.',
  flagAnswer: 'FLAG{RSA_WEAK_KEY_A}',
  briefing: {
    en: 'A developer used RSA with dangerously small primes. The public key has been leaked.',
    ar: 'استخدم مطور RSA مع أعداد أولية صغيرة بشكل خطير. تم تسريب المفتاح العام.',
  },
  stepsOverview: {
    en: [
      'Factor n=3233 → find p and q',
      'Compute φ(n) = (p-1)(q-1)',
      'Find d = modular_inverse(e, φ(n))',
      'Decrypt: plaintext = c^d mod n → ASCII → submit as FLAG{CHAR}',
    ],
    ar: [
      'حلّل n=3233 → ابحث عن p و q',
      'احسب φ(n) = (p-1)(q-1)',
      'ابحث عن d = modular_inverse(e, φ(n))',
      'افك التشفير: plaintext = c^d mod n → ASCII → أرسل كـ FLAG{CHAR}',
    ],
  },
  solution: {
    context: 'RSA with n=3233. Small n can be factored trivially. p=61, q=53.',
    vulnerableCode: 'n = 3233, e = 17, c = 2790',
    exploitation: 'Factor 3233 → 61×53. φ=3120. d=modular_inverse(17,3120)=2753. 2790^2753 mod 3233 = 65 = "A".',
    steps: {
      en: [
        'Factor 3233 → 61×53',
        'φ(3233) = 60×52 = 3120',
        'd = modular_inverse(17, 3120) = 2753',
        '2790^2753 mod 3233 = 65 = "A"',
      ],
      ar: [
        'حلّل 3233 → 61×53',
        'φ(3233) = 60×52 = 3120',
        'd = modular_inverse(17, 3120) = 2753',
        '2790^2753 mod 3233 = 65 = "A"',
      ],
    },
    fix: ['Use RSA-2048 or RSA-4096. Never use primes smaller than 1024 bits.'],
  },
  postSolve: {
    explanation: {
      en: 'Real RSA uses 2048–4096 bit primes. Factoring n of that size is computationally infeasible with current technology.',
      ar: 'RSA الحقيقي يستخدم أعداداً أولية من 2048–4096 بت. تحليل n بهذا الحجم غير ممكن حسابياً بالتكنولوجيا الحالية.',
    },
    impact: {
      en: 'Weak RSA keys can be factored in milliseconds, exposing all encrypted data.',
      ar: 'مفاتيح RSA الضعيفة يمكن تحليلها في ميلي ثانية، مما يكشف جميع البيانات المشفرة.',
    },
    fix: ['Use RSA-2048 minimum. Prefer RSA-4096 or ECC (Curve25519) for modern systems.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'n=3233 is very small. Try dividing by small primes starting from 2.', xpCost: 10 },
    { order: 2, content: 'n = 61 × 53. Now compute φ(n) = (p-1)(q-1).', xpCost: 20 },
    { order: 3, content: 'd = modular_inverse(17, 3120) = 2753. plaintext = 2790^2753 mod 3233.', xpCost: 30 },
  ],
};
