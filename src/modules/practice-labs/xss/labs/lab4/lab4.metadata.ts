// src/modules/practice-labs/xss/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab4Metadata: LabMetadata = {
  slug: 'xss-markdown-bio-escape',
  title: 'XSS: Unsafe Markdown Bio Injection',
  ar_title: 'XSS عبر Markdown: حقن سيرة المطور',
  description:
    'Exploit an unsafe Markdown renderer on a developer portfolio platform to inject a persistent XSS payload into your profile bio that executes when an admin reviews your profile.',
  ar_description:
    'استغل محلل Markdown غير آمن في منصة محافظ المطورين لحقن XSS payload مستمر في السيرة الذاتية يُنفَّذ عند مراجعة المشرف للملف الشخصي.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Stored XSS',
    'Markdown Parser Bypass',
    'Context-Aware Payload Crafting',
    'HTML-in-Markdown',
  ],
  xpReward: 280,
  pointsReward: 130,
  duration: 50,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "Update your developer bio with an XSS payload embedded in Markdown. Then trigger the admin profile review to simulate your payload executing in the admin's browser context.",
  ar_goal:
    'حدّث السيرة الذاتية لمطورك بـ XSS payload مضمَّن في Markdown. ثم افعّل مراجعة الملف الشخصي للأدمن لمحاكاة تنفيذ payload الخاص بك في سياق متصفح الأدمن.',

  briefing: {
    en: `DevShowcase — a platform where developers publish professional portfolios.
Profile bios support Markdown. Rich formatting. Very developer-friendly.
You update your bio: ## About Me\nI build things with **React** and *Node.js*.
It renders beautifully. Headings. Bold. Italic. Clean.
The platform uses marked.js — a popular Markdown parser.
An older version. Without the sanitize option enabled.
Marked.js allows inline HTML in Markdown by default.
So you try: I am a developer. <b>Bold HTML in Markdown</b>
It renders. HTML is passing through the parser untouched.
An admin_reviewer approves profiles before they go public.
They load the review panel. All pending profiles render their bios.
All of them. At once. As innerHTML.`,
    ar: `DevShowcase — منصة ينشر فيها المطورون محافظ مهنية.
سِيَر الملفات الشخصية تدعم Markdown. تنسيق غني. ودي للمطورين.
تحدّث سيرتك الذاتية: ## About Me\nI build things with **React** and *Node.js*.
تُعرَض بشكل جميل. عناوين. عريض. مائل. نظيف.
تستخدم المنصة marked.js — محلل Markdown شائع.
إصدار قديم. دون تفعيل خيار sanitize.
يسمح marked.js بـ HTML مضمَّن في Markdown بشكل افتراضي.
لذا تحاول: أنا مطور. <b>HTML عريض في Markdown</b>
يُعرَض. HTML يمر عبر المحلل دون تعديل.
admin_reviewer يوافق على الملفات قبل نشرها.
يحمّل لوحة المراجعة. جميع الملفات المعلقة تعرض سِيَرها.
جميعها. مرة واحدة. كـ innerHTML.`,
  },

  stepsOverview: {
    en: [
      'Update your bio with normal Markdown — confirm rendering',
      'Test HTML passthrough: embed <b>Bold</b> in your Markdown bio — if it renders bold, HTML is allowed',
      'Understand why <script> tags fail in innerHTML context',
      'Craft an auto-firing HTML event payload embedded in the Markdown bio',
      'Trigger the admin profile review simulation — flag returned on execution',
    ],
    ar: [
      'حدّث سيرتك الذاتية بـ Markdown عادي — أكّد العرض',
      'اختبر تمرير HTML: ضمّن <b>Bold</b> في Markdown الخاص بسيرتك — إن عُرض بخط عريض، HTML مسموح',
      'افهم لماذا وسوم <script> تفشل في سياق innerHTML',
      'صمّم HTML event payload يُطلَق تلقائياً مضمَّن في Markdown السيرة',
      'افعّل محاكاة مراجعة الملف الشخصي للأدمن — يُعاد العلم عند التنفيذ',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "DevShowcase uses marked.js without sanitization to render profile bios. marked.js passes raw HTML through by default. The admin review panel renders all pending bios as innerHTML, executing any injected HTML/JavaScript in the admin's browser context.",
    vulnerableCode:
      '// Profile bio is stored raw, rendered with marked.js:\n' +
      "import { marked } from 'marked';\n" +
      '// ❌ No sanitizer configured:\n' +
      'profileBioElement.innerHTML = marked.parse(user.bio);',
    exploitation:
      '1. Update bio with: "I am a full-stack developer. <details open ontoggle=alert(document.cookie)><summary>Skills</summary>React</details>"\n' +
      '2. POST /admin/simulate-profile-review → admin panel renders bio → ontoggle fires automatically on open → cookie alert → flag returned.\n' +
      'Alternative: <img src=x onerror=alert(document.cookie)>',
    steps: {
      en: [
        'PUT /profile/bio { "bio": "## About\nI build <b>things</b>" } → bio renders with bold "things" → HTML confirmed',
        'PUT /profile/bio { "bio": "Dev. <details open ontoggle=alert(1)><summary>s</summary>x</details>" } → details element auto-opens → ontoggle fires',
        'PUT /profile/bio { "bio": "Dev. <img src=x onerror=alert(document.cookie)>" } → payload stored',
        'POST /admin/simulate-profile-review → admin panel loads all bios → onerror/ontoggle fires → FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519} returned',
      ],
      ar: [
        'PUT /profile/bio { "bio": "## About\nI build <b>things</b>" } → يُعرَض bio مع "things" بخط عريض → تم تأكيد HTML',
        'PUT /profile/bio { "bio": "Dev. <details open ontoggle=alert(1)><summary>s</summary>x</details>" } → يفتح عنصر details تلقائياً → يُطلَق ontoggle',
        'PUT /profile/bio { "bio": "Dev. <img src=x onerror=alert(document.cookie)>" } → تم تخزين الـ payload',
        'POST /admin/simulate-profile-review → لوحة الأدمن تحمّل جميع السِيَر → يُطلَق onerror/ontoggle → يُعاد FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519}',
      ],
    },
    fix: [
      'Sanitize marked.js output with DOMPurify: innerHTML = DOMPurify.sanitize(marked.parse(bio))',
      'Use marked.js with a sanitizer extension: marked.use({ extensions: [{ ... }] })',
      'Alternatively: parse Markdown to HTML, then strip all HTML tags server-side with a safe allowlist (strong, em, p, h1-h6, ul, li only)',
      'Admin panels with user content: treat as highest-risk rendering context — apply strictest sanitization',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Markdown parsers are a common XSS vector because they inherently convert text to HTML. When a parser allows raw HTML passthrough (as marked.js does by default), an attacker can embed arbitrary HTML in "formatted text." The risk is amplified when the output is rendered in a privileged context (admin panels). Classic <script> tags are blocked by innerHTML, but auto-firing event handlers on HTML5 elements (<details ontoggle>, <svg onload>, <img onerror>) bypass this restriction.',
      ar: 'محللو Markdown ناقل XSS شائع لأنهم بطبيعتهم يحوّلون النص إلى HTML. عندما يسمح محلل بتمرير HTML الخام (كما يفعل marked.js بشكل افتراضي)، يمكن للمهاجم تضمين HTML اعتباطي في "النص المنسَّق". يتضاعف الخطر عند عرض المخرجات في سياق مميز (لوحات الأدمن). وسوم <script> الكلاسيكية محظورة بواسطة innerHTML، لكن معالجات الأحداث التلقائية على عناصر HTML5 (<details ontoggle>، <svg onload>، <img onerror>) تتجاوز هذا القيد.',
    },
    impact: {
      en: 'Every admin who reviews the profile dashboard is compromised. The payload is "invisible" to casual inspection — it looks like a formatting feature (a details/summary element or an image). Markdown context gives a psychological bypass: users and developers often assume Markdown is safe because it appears to be a limited subset of formatting.',
      ar: 'كل أدمن يراجع لوحة الملفات الشخصية يُختَرَق. الـ payload "غير مرئي" للفحص العارض — يبدو كميزة تنسيق (عنصر details/summary أو صورة). يمنح سياق Markdown تجاوزاً نفسياً: المستخدمون والمطورون كثيراً ما يفترضون أن Markdown آمن لأنه يبدو كمجموعة فرعية محدودة من التنسيق.',
    },
    fix: [
      'Never trust Markdown output as safe HTML — always sanitize the rendered HTML',
      "DOMPurify allowlist: ALLOWED_TAGS: ['p', 'strong', 'em', 'h1'-'h6', 'ul', 'li', 'code', 'pre'] — no event handlers",
      'Server-side sanitization: clean HTML before storing, not just before rendering',
      "CSP: script-src 'self' — even if XSS is injected, inline events are blocked with strict CSP",
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Update your bio with a plain HTML tag: <b>Bold</b>. If the rendered preview shows bold text (not the literal tag), the Markdown parser is passing raw HTML through.',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        '<script> tags injected via innerHTML do not execute. Try HTML5 tags with auto-firing events: <details open ontoggle=alert(1)><summary>x</summary></details> — the ontoggle fires when details opens automatically.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Alternative: use <img src=x onerror="alert(document.cookie)"> in your bio. After updating, use POST /admin/simulate-profile-review to trigger the admin context render and get the flag.',
    },
  ],

  flagAnswer: 'FLAG{XSS_MARKDOWN_BYPASS_ADMIN_PROFILE_519}',
  initialState: {
    users: [
      {
        username: 'admin_reviewer',
        password: 'R3v!ewer_s3cur3_pass',
        role: 'ADMIN',
      },
    ],
    contents: [
      {
        title: 'Developer Profile',
        body: 'I am a passionate developer with 5 years of experience in React and Node.js.',
        meta: {
          skills: ['React', 'Node.js', 'TypeScript'],
          github: 'dev_user_99',
          status: 'pending_review',
        },
      },
    ],
  },
};
