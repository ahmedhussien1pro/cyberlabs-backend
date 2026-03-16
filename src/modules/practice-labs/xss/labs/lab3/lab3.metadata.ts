// src/modules/practice-labs/xss/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab3Metadata: LabMetadata = {
  slug: 'xss-dom-profile-bio',
  title: 'XSS: DOM-Based Profile Bio Injection',
  ar_title: 'XSS مبني على DOM: حقن السيرة الذاتية',
  description:
    'Exploit a DOM-based XSS vulnerability where the page reads from location.hash and writes it unsafely to the DOM using innerHTML.',
  ar_description:
    'استغل ثغرة XSS مبنية على DOM حيث تقرأ الصفحة من location.hash وتكتبه بشكل غير آمن في DOM باستخدام innerHTML.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: ['DOM-Based XSS', 'Source/Sink Analysis', 'location.hash', 'innerHTML'],
  xpReward: 180,
  pointsReward: 90,
  duration: 30,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  canonicalConceptId: 'xss-dom',
  environmentType: 'BLOG_CMS',

  missionBrief: {
    codename: 'HASH SINK',
    classification: 'CONFIDENTIAL',
    objective: 'A user profile page reads the bio parameter from location.hash and writes it to the DOM via innerHTML. Craft a hash-based URL that executes JavaScript when opened.',
    ar_objective: 'صفحة ملف المستخدم تقرأ معامل السيرة الذاتية من location.hash وتكتبه في DOM عبر innerHTML. صمّم URL قائم على الـ hash يُنفّذ JavaScript عند فتحه.',
    background: 'DOM-based XSS never reaches the server — the payload lives entirely in the URL fragment and executes client-side.',
    successCriteria: [
      'Identify the source (location.hash) and sink (innerHTML)',
      'Inject HTML via the hash parameter',
      'Escalate to JavaScript execution',
      'Craft a shareable malicious URL',
    ],
  },

  labInfo: {
    vulnType: 'DOM-Based XSS',
    ar_vulnType: 'XSS مبني على DOM',
    cweId: 'CWE-79',
    cvssScore: 6.9,
    description: 'DOM XSS occurs entirely client-side. The server never sees the payload — it lives in the URL fragment (#). The browser reads it and writes it unsafely to the DOM.',
    ar_description: 'يحدث DOM XSS بالكامل على جانب العميل. الخادم لا يرى الـ payload أبداً — يعيش في جزء URL (#). المتصفح يقرأه ويكتبه بشكل غير آمن في DOM.',
    whatYouLearn: [
      'What are sources and sinks in DOM XSS',
      'Why location.hash is a dangerous source',
      'How innerHTML is a dangerous sink',
      'How to find DOM XSS with browser DevTools',
    ],
    techStack: ['JavaScript', 'Browser DOM', 'location.hash'],
    references: [
      { label: 'PortSwigger: DOM-based XSS', url: 'https://portswigger.net/web-security/cross-site-scripting/dom-based' },
    ],
  },

  goal: 'Craft a URL with a malicious hash fragment that executes JavaScript when the profile page loads.',
  ar_goal: 'صمّم URL مع جزء hash خبيث يُنفّذ JavaScript عند تحميل صفحة الملف الشخصي.',

  briefing: {
    en: `DevConnect — a developer portfolio platform.
You can share your profile with a custom bio: /profile#bio=Hello+World
The page reads location.hash and writes it to a div: bioDiv.innerHTML = decodeURIComponent(bioParam)
The server never sees the hash fragment.
But the browser does. And innerHTML does too.`,
    ar: `DevConnect — منصة محافظ المطورين.
يمكنك مشاركة ملفك الشخصي مع سيرة ذاتية مخصصة: /profile#bio=Hello+World
تقرأ الصفحة location.hash وتكتبه في div: bioDiv.innerHTML = decodeURIComponent(bioParam)
الخادم لا يرى جزء الـ hash.
لكن المتصفح يراه. وinnerHTML كذلك.`,
  },

  stepsOverview: {
    en: [
      'Visit /profile#bio=Hello — confirm the text renders in the bio div',
      'Test HTML: /profile#bio=<b>test</b> — if bold, innerHTML is confirmed',
      'Escalate: /profile#bio=<img src=x onerror=alert(1)>',
      'Craft the final URL and submit the flag',
    ],
    ar: [
      'زر /profile#bio=Hello — أكّد ظهور النص في div السيرة الذاتية',
      'اختبر HTML: /profile#bio=<b>test</b> — إن كان بخط عريض، يُؤكَّد innerHTML',
      'تصاعد: /profile#bio=<img src=x onerror=alert(1)>',
      'صمّم الـ URL النهائي وأرسل العلم',
    ],
  },

  solution: {
    context: 'Profile page JS: const bioParam = location.hash.split("bio=")[1]; bioDiv.innerHTML = decodeURIComponent(bioParam);',
    vulnerableCode: 'const bioParam = location.hash.split("bio=")[1];\nbioDiv.innerHTML = decodeURIComponent(bioParam);',
    exploitation: '/profile#bio=<img src=x onerror=alert(document.cookie)>',
    steps: {
      en: [
        '/profile#bio=Hello → text appears in bio section',
        '/profile#bio=<b>Hello</b> → bold text → innerHTML confirmed',
        '/profile#bio=<img src=x onerror=alert(1)> → alert fires',
        'Submit the malicious URL to trigger flag',
      ],
      ar: [
        '/profile#bio=Hello → النص يظهر في قسم السيرة الذاتية',
        '/profile#bio=<b>Hello</b> → نص عريض → تأكيد innerHTML',
        '/profile#bio=<img src=x onerror=alert(1)> → alert يُطلَق',
        'أرسل الـ URL الخبيث لتفعيل العلم',
      ],
    },
    fix: [
      'Use textContent instead of innerHTML: bioDiv.textContent = bioParam',
      'Sanitize with DOMPurify before innerHTML assignment',
      'Avoid reading from location.hash for dynamic content',
    ],
  },

  postSolve: {
    explanation: {
      en: 'DOM XSS never touches the server. The entire attack lives in the URL fragment. Server-side defenses (WAF, input validation) cannot stop it — only client-side output encoding at the sink can.',
      ar: 'DOM XSS لا يلمس الخادم أبداً. الهجوم بأكمله يعيش في جزء URL. دفاعات جانب الخادم (WAF، التحقق من المدخلات) لا يمكنها إيقافه — فقط ترميز المخرجات على جانب العميل عند الـ sink يمكنه ذلك.',
    },
    impact: {
      en: 'Shareable malicious URLs — attacker sends a link, victim opens it, script executes. No server compromise needed.',
      ar: 'URLs خبيثة قابلة للمشاركة — يرسل المهاجم رابطاً، تفتحه الضحية، ينفذ السكريبت. لا حاجة لاختراق الخادم.',
    },
    fix: ['textContent over innerHTML', 'DOMPurify at every innerHTML sink', 'CSP to block inline scripts'],
  },

  hints: [
    {
      order: 1, xpCost: 10,
      content: 'Open DevTools → Console. Type: location.hash — you can see the hash value. Now check the page source for where bioDiv.innerHTML is assigned.',
      ar_content: 'افتح DevTools → Console. اكتب: location.hash — يمكنك رؤية قيمة الـ hash. الآن تحقق من مصدر الصفحة لمعرفة أين يُعيَّن bioDiv.innerHTML.',
    },
    {
      order: 2, xpCost: 20,
      content: 'Test with /profile#bio=<b>test</b> — if "test" renders bold, innerHTML is the sink and it\'s not sanitized.',
      ar_content: 'اختبر بـ /profile#bio=<b>test</b> — إن ظهر "test" بخط عريض، innerHTML هو الـ sink وغير مُعقَّم.',
    },
    {
      order: 3, xpCost: 30,
      content: 'Try: /profile#bio=<img src=x onerror=alert(1)>  — the image src fails immediately, triggering onerror.',
      ar_content: 'جرّب: /profile#bio=<img src=x onerror=alert(1)> — يفشل مصدر الصورة فوراً، مما يُطلق onerror.',
    },
  ],

  flagAnswer: 'FLAG{XSS_DOM_HASH_BIO_INJECT_443}',
  initialState: {},
};
