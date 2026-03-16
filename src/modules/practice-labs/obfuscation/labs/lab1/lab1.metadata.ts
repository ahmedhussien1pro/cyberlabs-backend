import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'obfuscation-lab1-js-hex',
  title: 'JavaScript Hex Obfuscation',
  ar_title: 'تشويش JavaScript بالتشفير السداسي عشر',
  description: 'Decode hex-encoded strings in obfuscated JS to find the hidden password.',
  ar_description: 'فك تشفير النصوص المرمَّزة بـ hex في JavaScript المشوَّش للعثور على كلمة المرور المخفية.',
  difficulty: 'BEGINNER',
  category: 'TOOLS_AND_TECHNIQUES',
  executionMode: 'SHARED_BACKEND',
  skills: ['JavaScript', 'Hex Decoding', 'Code Analysis', 'Obfuscation'],
  xpReward: 60,
  pointsReward: 60,
  duration: 20,
  isPublished: true,
  goal: 'Decode hex-encoded strings in obfuscated JS to find the hidden password.',
  ar_goal: 'فك تشفير النصوص المرمَّزة بـ hex في JS المشوَّش للعثور على كلمة المرور المخفية.',
  flagAnswer: 'FLAG{OBFUSCATION_JS_HEX_DECODED}',
  briefing: {
    en: 'A suspicious script was found encoded in hex. Decode it to understand what it does.',
    ar: 'تم العثور على سكريبت مريب مرمَّز بـ hex. فك تشفيره لفهم ما يفعله.',
  },
  stepsOverview: {
    en: [
      'Examine the obfuscated JavaScript code',
      'Decode \\xNN hex sequences to readable strings',
      'Trace variable assignments to find the password',
      'Submit as FLAG{password}',
    ],
    ar: [
      'افحص كود JavaScript المشوَّش',
      'فك تشفير متواليات hex \\xNN إلى نصوص مقروءة',
      'تتبع تعيينات المتغيرات للعثور على كلمة المرور',
      'أرسل كـ FLAG{password}',
    ],
  },
  solution: {
    context: 'JavaScript uses \\xNN hex escape sequences. Decoding them reveals obfuscated variable names and strings.',
    vulnerableCode: 'var _0x1a2b = \\x73\\x33\\x63\\x72\\x33\\x74',
    exploitation: 'Decode each \\xNN sequence. \\x73 = s, \\x33 = 3, etc. → password = s3cr3t_0bfusc4t3d',
    steps: {
      en: [
        'Decode \\x73\\x33\\x63\\x72\\x33\\x74 → "s3cr3t"',
        'Trace full variable → s3cr3t_0bfusc4t3d',
        'Submit FLAG{s3cr3t_0bfusc4t3d}',
      ],
      ar: [
        'فك \\x73\\x33\\x63\\x72\\x33\\x74 → "s3cr3t"',
        'تتبع المتغير الكامل → s3cr3t_0bfusc4t3d',
        'أرسل FLAG{s3cr3t_0bfusc4t3d}',
      ],
    },
    fix: ['Never store credentials in client-side code, obfuscated or not.'],
  },
  postSolve: {
    explanation: {
      en: 'JS obfuscation is security by obscurity. Tools like de4js, jsnice.org, and AST parsers automate deobfuscation.',
      ar: 'تشويش JS هو أمان بالغموض. أدوات مثل de4js و jsnice.org ومحللو AST تُؤتمت إلغاء التشويش.',
    },
    impact: {
      en: 'Obfuscated code containing credentials can be reversed in seconds by any analyst.',
      ar: 'الكود المشوَّش الذي يحتوي على بيانات اعتماد يمكن عكسه في ثوانٍ من قِبَل أي محلل.',
    },
    fix: ['Never embed credentials in client-side code.', 'Use server-side authentication APIs.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Look for \\xNN patterns — each represents one ASCII character.', xpCost: 5 },
    { order: 2, content: '\\x73=s, \\x33=3, \\x63=c, \\x72=r, \\x74=t. Decode the full string.', xpCost: 10 },
    { order: 3, content: 'The password is s3cr3t_0bfusc4t3d. Submit as FLAG{s3cr3t_0bfusc4t3d}.', xpCost: 20 },
  ],
};
