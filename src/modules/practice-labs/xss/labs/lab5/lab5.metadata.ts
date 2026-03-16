// src/modules/practice-labs/xss/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab5Metadata: LabMetadata = {
  slug: 'xss-mutation-innerhtml',
  title: 'XSS: Mutation-Based Filter Bypass',
  ar_title: 'XSS: تجاوز المرشح عبر الطفرة',
  description:
    'A server-side HTML filter strips script tags — but the DOM parser mutates your input in a way that reconstructs the payload after filtering.',
  ar_description:
    'مرشح HTML على جانب الخادم يزيل وسوم script — لكن محلل DOM يُحوِّل مدخلك بطريقة تُعيد بناء الـ payload بعد الترشيح.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['Mutation XSS', 'Filter Bypass', 'Browser Parsing Quirks', 'mXSS'],
  xpReward: 320,
  pointsReward: 160,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  canonicalConceptId: 'xss-mutation',
  environmentType: 'BLOG_CMS',

  missionBrief: {
    codename: 'MUTATION ENGINE',
    classification: 'TOP_SECRET',
    objective: 'The wiki editor strips <script> tags server-side. But the browser\'s HTML parser has mutation quirks — certain malformed markup is "corrected" into valid XSS payloads after the filter has already run.',
    ar_objective: 'محرر الويكي يزيل وسوم <script> على جانب الخادم. لكن محلل HTML للمتصفح لديه غرائب في الطفرات — ترميز مشوَّه معين يُصحَّح إلى payloads XSS صالحة بعد تشغيل المرشح بالفعل.',
    background: 'mXSS (Mutation XSS) exploits the gap between what the server sanitizes and what the browser reconstructs from malformed HTML.',
    successCriteria: [
      'Confirm <script> tags are stripped by the server',
      'Find a mutation-based payload the filter misses',
      'Execute JavaScript through the mutated markup',
      'Capture the flag',
    ],
    warningNote: 'mXSS is a real-world technique that has bypassed major sanitizers including older versions of DOMPurify.',
  },

  labInfo: {
    vulnType: 'Mutation-Based XSS (mXSS)',
    ar_vulnType: 'XSS قائم على الطفرة (mXSS)',
    cweId: 'CWE-79',
    cvssScore: 7.8,
    description: 'mXSS exploits differences between how a server sanitizer parses HTML versus how the browser parser reconstructs it. Malformed markup passes the filter, then gets "corrected" into a valid XSS payload by the browser.',
    ar_description: 'يستغل mXSS الاختلافات بين كيفية تحليل الـ sanitizer للخادم لـ HTML وكيفية إعادة بناء محلل المتصفح له. الترميز المشوَّه يجتاز المرشح، ثم يُصحَّح إلى payload XSS صالح من قِبَل المتصفح.',
    whatYouLearn: [
      'What mutation XSS (mXSS) is and why it exists',
      'How browser HTML parsing differs from server-side parsing',
      'Why regex-based HTML filters always fail',
      'How DOMPurify evolved to handle mXSS',
    ],
    techStack: ['Node.js', 'Browser HTML Parser', 'innerHTML', 'Server-side regex filter'],
    references: [
      { label: 'mXSS Research Paper', url: 'https://cure53.de/fp170.pdf' },
      { label: 'PortSwigger: XSS filter bypass', url: 'https://portswigger.net/web-security/cross-site-scripting/contexts' },
    ],
  },

  goal: 'Bypass the server-side script tag filter using a mutation-based payload to execute JavaScript.',
  ar_goal: 'تجاوز مرشح وسوم السكريبت على جانب الخادم باستخدام payload قائم على الطفرة لتنفيذ JavaScript.',

  briefing: {
    en: `WikiCore — a collaborative documentation platform.
You can submit wiki articles with rich HTML content.
The server strips <script> tags before saving.
You test: <script>alert(1)</script> → stored as: alert(1) (tags removed).
But you've read about mXSS.
The browser reconstructs malformed HTML in unexpected ways.
What if you submit something the filter doesn't recognize as a script tag — but the browser does?`,
    ar: `WikiCore — منصة توثيق تعاونية.
يمكنك إرسال مقالات ويكي بمحتوى HTML غني.
يزيل الخادم وسوم <script> قبل الحفظ.
تختبر: <script>alert(1)</script> → يُخزَّن كـ: alert(1) (الوسوم أُزيلت).
لكنك قرأت عن mXSS.
يُعيد المتصفح بناء HTML المشوَّه بطرق غير متوقعة.
ماذا لو أرسلت شيئاً لا يتعرف عليه المرشح كوسم script — لكن المتصفح يفعل؟`,
  },

  stepsOverview: {
    en: [
      'Confirm <script> is stripped — test basic payload',
      'Try an img onerror payload — check if event handlers are also stripped',
      'Try mutation vectors: malformed tags, nested encodings, SVG/MathML namespaces',
      'Find the payload that survives the filter and executes in the browser',
    ],
    ar: [
      'أكّد أن <script> يُزال — اختبر payload أساسي',
      'جرّب img onerror payload — تحقق إن كانت معالجات الأحداث تُزال أيضاً',
      'جرّب متجهات الطفرة: وسوم مشوَّهة، ترميزات متداخلة، مساحات أسماء SVG/MathML',
      'ابحث عن الـ payload الذي يصمد أمام المرشح وينفذ في المتصفح',
    ],
  },

  solution: {
    context: 'Server strips <script> and </script> via regex. Does not handle SVG animate or MathML.',
    vulnerableCode: "content = content.replace(/<script[^>]*>/gi, '').replace(/<\\/script>/gi, '');",
    exploitation: '<svg><animate onbegin=alert(document.cookie) attributeName=x dur=1s></svg>',
    steps: {
      en: [
        '<script>alert(1)</script> → filtered → try other vectors',
        '<img src=x onerror=alert(1)> → also filtered',
        '<svg><animate onbegin=alert(1) attributeName=x dur=1s></svg> → NOT caught by regex filter',
        'SVG animate fires onbegin on page load → JavaScript executes → flag returned',
      ],
      ar: [
        '<script>alert(1)</script> → يُرشَّح → جرّب متجهات أخرى',
        '<img src=x onerror=alert(1)> → يُرشَّح أيضاً',
        '<svg><animate onbegin=alert(1) attributeName=x dur=1s></svg> → لا يُؤخَذ بواسطة مرشح regex',
        'SVG animate يُطلِق onbegin عند تحميل الصفحة → ينفذ JavaScript → يُعاد العلم',
      ],
    },
    fix: [
      'Never use regex for HTML sanitization — use a proper HTML parser',
      'Use DOMPurify (updated version) for client-side sanitization',
      'Use bleach (Python) or sanitize-html (Node) for server-side',
      'Allowlist approach: only permit specific safe tags and attributes',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Regex-based HTML filters always have blind spots. SVG, MathML, and malformed HTML all have parsing quirks that browsers handle differently from simple string matching. Real sanitization requires parsing the HTML, not matching strings.',
      ar: 'مرشحات HTML القائمة على regex دائماً لها نقاط عمياء. SVG وMathML وHTML المشوَّه لديهم غرائب في التحليل يتعامل معها المتصفح بشكل مختلف عن مطابقة السلاسل البسيطة. التعقيم الحقيقي يتطلب تحليل HTML وليس مطابقة السلاسل.',
    },
    impact: {
      en: 'Filter bypass enables stored XSS despite apparent protection. Any user-submitted content platform with regex filtering is vulnerable to mXSS variants.',
      ar: 'تجاوز المرشح يُمكِّن Stored XSS رغم الحماية الظاهرة. أي منصة محتوى مُرسَل من المستخدمين مع ترشيح regex عرضة لمتغيرات mXSS.',
    },
    fix: ['DOMPurify', 'sanitize-html with strict allowlist', 'CSP nonces as defense-in-depth'],
  },

  hints: [
    {
      order: 1, xpCost: 20,
      content: 'Submit <script>alert(1)</script> — confirm it gets stripped. Then try <img src=x onerror=alert(1)> — does that also get stripped? Map exactly what the filter catches.',
      ar_content: 'أرسل <script>alert(1)</script> — أكّد أنه يُزال. ثم جرّب <img src=x onerror=alert(1)> — هل يُزال أيضاً؟ حدّد بدقة ما يُمسكه المرشح.',
    },
    {
      order: 2, xpCost: 35,
      content: 'The filter only blocks specific patterns. Try a namespace-based vector: SVG has event attributes that aren\'t standard HTML events. Look up SVG animate element attributes.',
      ar_content: 'المرشح يحجب فقط أنماطاً محددة. جرّب متجهاً قائماً على مساحة الأسماء: SVG له سمات أحداث ليست أحداث HTML قياسية. ابحث عن سمات عنصر SVG animate.',
    },
    {
      order: 3, xpCost: 50,
      content: 'Try: <svg><animate onbegin=alert(1) attributeName=x dur=1s></svg>\nThe onbegin event fires when the SVG animation begins — immediately on page load. The regex filter doesn\'t know about SVG animate events.',
      ar_content: 'جرّب: <svg><animate onbegin=alert(1) attributeName=x dur=1s></svg>\nيُطلَق حدث onbegin عند بدء الرسوم المتحركة SVG — فوراً عند تحميل الصفحة. مرشح regex لا يعرف عن أحداث SVG animate.',
    },
  ],

  flagAnswer: 'FLAG{XSS_MXSS_SVG_FILTER_BYPASS_556}',
  initialState: {},
};
