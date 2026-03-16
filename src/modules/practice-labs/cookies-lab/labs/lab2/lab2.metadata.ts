import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'cookies-lab2-hmac-forgery',
  title: 'HMAC Cookie Forgery',
  ar_title: 'تزوير كوكيز HMAC',
  description: 'Crack the weak HMAC secret and forge an admin session cookie.',
  ar_description: 'اكسر السر الضعيف لـ HMAC وازوِّر كوكيز جلسة المدير.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['HMAC', 'Cookie Forgery', 'Weak Secret Cracking', 'Session Security'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  goal: 'Crack the weak HMAC secret and forge an admin session cookie.',
  ar_goal: 'اكسر السر الضعيف لـ HMAC وازوِّر كوكيز جلسة المدير.',
  flagAnswer: 'FLAG{HMAC_FORGERY_WEAK_SECRET}',
  briefing: {
    en: 'The app uses HMAC-SHA256 to sign cookies, but with a weak secret and a truncated signature.',
    ar: 'يستخدم التطبيق HMAC-SHA256 لتوقيع الكوكيز، لكن مع سر ضعيف وتوقيع مبتور.',
  },
  stepsOverview: {
    en: [
      'Login to get a signed session cookie',
      'Decode and examine the cookie format',
      'Crack the HMAC secret (try common passwords)',
      'Forge a new cookie with role=admin and valid signature',
      'Send forged cookie to /admin → get flag',
    ],
    ar: [
      'سجّل دخولاً للحصول على كوكيز جلسة موقَّعة',
      'فك الترميز وافحص شكل الكوكيز',
      'اكسر سر HMAC (جرّب كلمات المرور الشائعة)',
      'ازوِّر كوكيز جديدة مع role=admin وتوقيع صالح',
      'أرسل الكوكيز المزوَّرة إلى /admin → احصل على الفلاج',
    ],
  },
  solution: {
    context: 'Cookie = base64(payload).sig[:8]. HMAC secret is "password". Truncated to 8 chars.',
    vulnerableCode: 'const sig = crypto.createHmac("sha256", "password").update(payload).digest("hex").slice(0,8);',
    exploitation: 'Crack secret="password" → forge payload with role=admin → sign → send.',
    steps: {
      en: [
        'Login → get cookie: base64(payload).sig[:8]',
        'Try HMAC secret = "password" → matches signature',
        'Create payload: {username, role: "admin"} → base64 encode',
        'HMAC-SHA256(payload, "password")[:8] → new signature',
        'Send forged cookie → admin access → FLAG',
      ],
      ar: [
        'تسجيل الدخول → الحصول على الكوكيز: base64(payload).sig[:8]',
        'جرّب سر HMAC = "password" → يطابق التوقيع',
        'أنشئ payload: {username, role: "admin"} → رمِّز بـ base64',
        'HMAC-SHA256(payload, "password")[:8] → توقيع جديد',
        'أرسل الكوكيز المزوَّرة → وصول المدير → الفلاج',
      ],
    },
    fix: [
      'Use cryptographically random secrets (32+ bytes).',
      'Never truncate HMAC signatures.',
      'Consider JWT with RS256 (asymmetric) for session tokens.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'Weak HMAC secrets are vulnerable to dictionary/brute-force attacks. Truncated signatures reduce the keyspace from 256 bits to 32 bits, making collisions and forgery trivial.',
      ar: 'أسرار HMAC الضعيفة عرضة لهجمات القاموس/القوة الغاشمة. التوقيعات المبتورة تُقلّص الفضاء من 256 بت إلى 32 بت، مما يجعل التصادمات والتزوير تافهَين.',
    },
    impact: {
      en: 'Full session forgery. Attacker can impersonate any user including admins.',
      ar: 'تزوير جلسة كامل. يمكن للمهاجم انتحال هوية أي مستخدم بما في ذلك المديرين.',
    },
    fix: ['Use 256-bit random secrets.', 'Never truncate signatures.', 'Rotate secrets regularly.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'The cookie format is base64(payload).signature[:8]. Decode the payload first.', xpCost: 10 },
    { order: 2, content: 'The HMAC secret is a common password. Try: password, 123456, abc123, secret.', xpCost: 25 },
    { order: 3, content: 'Secret is "password". Forge: btoa(JSON.stringify({...role:"admin"})) + "." + HMAC[:8].', xpCost: 40 },
  ],
};
