import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  slug: 'cryptography-lab3-rsa-weak-key',
  title: 'RSA Weak Key Attack',
  ar_title: 'هجوم على مفتاح RSA الضعيف',
  description: 'Factor a small RSA modulus, recover the private key, and decrypt the ciphertext.',
  ar_description: 'حلل معامل RSA الصغير، استرجع المفتاح الخاص، وفك تشفير النص المشفر.',
  difficulty: 'INTERMEDIATE',
  category: 'CRYPTOGRAPHY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Cryptography', 'RSA', 'Prime Factorization', 'Modular Arithmetic'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  imageUrl: null,
  goal: 'Factor n=3233 into p and q, compute private key d, and decrypt ciphertext=2790.',
  ar_goal: 'حلّل n=3233 إلى p وq، احسب المفتاح الخاص d، وفك تشفير ciphertext=2790.',
  flagAnswer: 'FLAG{A}',
  briefing: {
    story: 'A developer used RSA with dangerously small primes. The public key has been leaked.',
    objective: 'Factor n, compute d, decrypt the message, convert to ASCII.',
  },
  stepsOverview: [
    { step: 1, title: 'Get public key', description: 'Fetch n=3233, e=17, ciphertext=2790' },
    { step: 2, title: 'Factor n', description: 'Find p and q such that p×q = n' },
    { step: 3, title: 'Compute φ(n)', description: 'φ(n) = (p-1)(q-1)' },
    { step: 4, title: 'Find d', description: 'd = modular_inverse(e, φ(n))' },
    { step: 5, title: 'Decrypt', description: 'plaintext = ciphertext^d mod n → ASCII' },
  ],
  solution: {
    summary: 'p=61, q=53, φ(n)=3120, d=2753, plaintext=65=ASCII "A".',
    steps: ['Factor 3233 → 61×53', 'φ(3233) = 60×52 = 3120', 'd = modular_inverse(17, 3120) = 2753', '2790^2753 mod 3233 = 65 = "A"'],
  },
  postSolve: {
    lesson: 'Real RSA uses 2048–4096 bit primes. Factoring n of that size is computationally infeasible with current technology.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Try dividing n by small primes: 2, 3, 5, 7, 11, ...', xpCost: 10 },
    { order: 2, content: 'φ(n) = (p-1) × (q-1). Use extended Euclidean to find d.', xpCost: 20 },
    { order: 3, content: 'p=61, q=53. Now compute φ and d.', xpCost: 30 },
  ],
};
