// src/modules/practice-labs/csrf/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const csrfLab3Metadata: LabMetadata = {
  slug: 'csrf-samesite-lax-bypass-university',
  title: 'CSRF: SameSite=Lax Bypass — University Portal Grade Manipulation',
  ar_title: 'CSRF: تجاوز SameSite=Lax — التلاعب بالدرجات في بوابة الجامعة',
  description:
    'Exploit a CSRF vulnerability in a university portal that uses SameSite=Lax cookies. Bypass the protection by using a top-level GET navigation (which Lax allows) to trigger a state-changing action that was incorrectly implemented as a GET request.',
  ar_description:
    'استغل ثغرة CSRF في بوابة جامعية تستخدم ملفات تعريف ارتباط SameSite=Lax. تجاوز الحماية باستخدام التنقل عبر GET على المستوى الأعلى (الذي يسمح به Lax) لتشغيل إجراء تغيير حالة تم تنفيذه بشكل خاطئ كطلب GET.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'CSRF',
    'SameSite Bypass',
    'Cookie Security',
    'GET-based State Change',
  ],
  xpReward: 260,
  pointsReward: 130,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: "The university portal uses SameSite=Lax cookies. The grade update endpoint incorrectly uses GET. Exploit the Lax bypass: a cross-site top-level GET navigation sends cookies — use this to change a student's grade to A+.",
  ar_goal:
    'تستخدم البوابة الجامعية ملفات تعريف ارتباط SameSite=Lax. يستخدم endpoint تحديث الدرجات GET بشكل خاطئ. استغل تجاوز Lax: التنقل GET عبر الأصول على المستوى الأعلى يرسل الكوكيز — استخدم هذا لتغيير درجة الطالب إلى A+.',

  briefing: {
    en: `UniTrack — student portal. Grades, attendance, course registration.
"We use SameSite=Lax. We're CSRF-protected."
SameSite=Lax blocks cross-site POSTS. Subresource loads. iframes.
It does NOT block top-level GET navigations.
A link. A redirect. window.location.href.
If someone clicks a link to your site — the cookie goes.
Now you find something interesting in the /grades/update endpoint.
GET /grades/update?studentId=STU-001&courseId=CS401&grade=C+
A GET request.
That changes data.
SameSite=Lax doesn't protect GET state-change endpoints.
The developer thought SameSite was a complete CSRF shield.
It's not.`,
    ar: `UniTrack — بوابة الطلاب. الدرجات، الحضور، تسجيل المقررات.
"نستخدم SameSite=Lax. نحن محميون من CSRF."
يحجب SameSite=Lax POST عبر المواقع. تحميل الموارد الفرعية. iframes.
لا يحجب التنقلات GET على المستوى الأعلى.
رابط. إعادة توجيه. window.location.href.
إذا نقر شخص ما على رابط لموقعك — يذهب الكوكي.
الآن تجد شيئاً مثيراً في endpoint /grades/update.
GET /grades/update?studentId=STU-001&courseId=CS401&grade=C+
طلب GET.
يغير البيانات.
لا يحمي SameSite=Lax نقاط تغيير حالة GET.
اعتقد المطور أن SameSite كان درعاً CSRF كاملاً.
إنه ليس كذلك.`,
  },

  stepsOverview: {
    en: [
      'Inspect the grade update flow — discover that /grades/update uses GET with query parameters, not POST',
      'Understand SameSite=Lax: blocks cross-site POST/subresources, but ALLOWS top-level GET navigation (links, redirects)',
      'Craft the attack URL: GET /grades/update?studentId=STU-001&courseId=CS401&grade=A%2B',
      'Simulate top-level navigation via /csrf/simulate-victim-navigation — cookies sent, grade changes',
      'GET /grades/STU-001 — verify grade is now A+ → flag returned',
    ],
    ar: [
      'افحص تدفق تحديث الدرجات — اكتشف أن /grades/update يستخدم GET مع query parameters، وليس POST',
      'افهم SameSite=Lax: يحجب POST/subresources عبر المواقع، لكن يسمح بالتنقل GET على المستوى الأعلى (روابط، إعادة توجيه)',
      'أنشئ URL الهجوم: GET /grades/update?studentId=STU-001&courseId=CS401&grade=A%2B',
      'محاكاة التنقل على المستوى الأعلى عبر /csrf/simulate-victim-navigation — الكوكيز مُرسَلة، الدرجة تتغير',
      'GET /grades/STU-001 — تحقق أن الدرجة أصبحت A+ → يُعاد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'UniTrack /grades/update is a GET endpoint that modifies database state. SameSite=Lax is set on session cookies. However, Lax ONLY blocks cross-site cookies on: (1) POST requests, (2) subresource loads (img, script, iframe). It does NOT block cookies on cross-site top-level GET navigations — i.e., when the user clicks a link or is redirected to the URL. Since the grade update is a GET endpoint, the Lax protection is completely bypassed.',
    vulnerableCode:
      "// Grade update (vulnerable — GET request changes state!):\napp.get('/grades/update', isAuthenticated, async (req, res) => {\n" +
      '  const { studentId, courseId, grade } = req.query;\n' +
      '  // ❌ GET request modifying state = CSRF via Lax bypass\n' +
      '  // ❌ SameSite=Lax does NOT protect GET state-change endpoints\n' +
      '  await db.grades.update({ studentId, courseId, grade });\n' +
      '  res.json({ success: true });\n' +
      '});',
    exploitation:
      'POST /csrf/simulate-victim-navigation { "targetPath": "/grades/update", "params": { "studentId": "STU-001", "courseId": "CS401", "grade": "A+" } } → GET request with victim session → grade updated to A+',
    steps: {
      en: [
        'GET /grades/update?studentId=STU-001&courseId=CS401&grade=B — test on yourself, confirm it works via GET',
        'Understand: SameSite=Lax sends cookies on top-level GET navigation — this IS exploitable',
        'POST /csrf/simulate-victim-navigation { "targetPath": "/grades/update", "params": { "studentId": "STU-001", "courseId": "CS401", "grade": "A+" } }',
        'GET /grades/STU-001 → grade: "A+" → flag: FLAG{CSRF_SAMESITE_LAX_BYPASS_GET_STATE_CHANGE_GRADE}',
      ],
      ar: [
        'GET /grades/update?studentId=STU-001&courseId=CS401&grade=B — اختبر على نفسك، أكّد أنه يعمل عبر GET',
        'افهم: يُرسل SameSite=Lax الكوكيز على تنقل GET على المستوى الأعلى — هذا قابل للاستغلال',
        'POST /csrf/simulate-victim-navigation { "targetPath": "/grades/update"، "params": { "studentId": "STU-001"، "courseId": "CS401"، "grade": "A+" } }',
        'GET /grades/STU-001 → grade: "A+" → العلم: FLAG{CSRF_SAMESITE_LAX_BYPASS_GET_STATE_CHANGE_GRADE}',
      ],
    },
    fix: [
      'NEVER use GET for state-changing operations — HTTP spec: GET must be idempotent and have no side effects',
      'Use POST/PUT/PATCH/DELETE for all data modifications — then SameSite=Lax actually protects them',
      'Upgrade to SameSite=Strict for maximum protection — blocks ALL cross-site cookie sending',
      'CSRF tokens on all state-changing endpoints regardless of HTTP method',
    ],
  },

  postSolve: {
    explanation: {
      en: "SameSite=Lax is a meaningful but partial CSRF defense. It blocks cross-site cookies on POST requests and subresource loads — but deliberately allows them on top-level GET navigations to preserve normal web functionality (e.g., clicking a link to a site where you're already logged in should work). The critical mistake here is using GET for a state-changing operation, violating HTTP semantics and creating a gap that Lax explicitly cannot cover.",
      ar: 'SameSite=Lax هو دفاع CSRF ذو معنى لكن جزئي. يحجب الكوكيز عبر المواقع على طلبات POST وتحميلات الموارد الفرعية — لكنه يسمح عمداً بها على تنقلات GET على المستوى الأعلى للحفاظ على وظائف الويب العادية (مثلاً، النقر على رابط لموقع مسجّل الدخول فيه يجب أن يعمل). الخطأ الحرج هنا هو استخدام GET لعملية تغيير الحالة، مما ينتهك دلالات HTTP ويخلق ثغرة لا يمكن لـ Lax تغطيتها صراحةً.',
    },
    impact: {
      en: 'Grade manipulation: any student who tricks a professor into clicking a link (or visiting a page with auto-redirect) can change any grade to A+. The impact extends to all students and all courses — full academic integrity compromise. One malicious link in a student forum, email, or social media post is sufficient.',
      ar: 'التلاعب بالدرجات: أي طالب يخدع أستاذاً للنقر على رابط (أو زيارة صفحة بإعادة توجيه تلقائية) يمكنه تغيير أي درجة إلى A+. التأثير يمتد لجميع الطلاب وجميع المقررات — اختراق كامل للنزاهة الأكاديمية. رابط خبيث واحد في منتدى الطلاب أو البريد الإلكتروني أو وسائل التواصل الاجتماعي كافٍ.',
    },
    fix: [
      'HTTP method correctness: GET = read only, POST/PUT = write — enforce this architectural rule without exceptions',
      'SameSite=Strict: eliminates ALL cross-site CSRF vectors including GET navigation attacks',
      'Per-session CSRF tokens with form submissions: attacker cannot predict the token from a GET URL',
      'Input validation on grade values: restrict to valid grade format to limit manipulation surface',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The portal uses SameSite=Lax. This blocks CSRF on POST but NOT on GET top-level navigation. Look carefully — does any state-changing action use a GET request?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Find the /grades/update endpoint. It uses GET with query parameters: studentId, courseId, grade. SameSite=Lax allows cookies when the user navigates directly to a URL via link or redirect.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'POST /csrf/simulate-victim-navigation with { "targetPath": "/grades/update", "params": { "studentId": "STU-001", "courseId": "CS401", "grade": "A+" } } to simulate the professor clicking a malicious link.',
    },
  ],

  flagAnswer: 'FLAG{CSRF_SAMESITE_LAX_BYPASS_GET_STATE_CHANGE_GRADE}',
  initialState: {
    users: [
      {
        username: 'student_omar',
        password: 'omar123',
        role: 'student',
        email: 'omar@university.edu',
      },
      {
        username: 'prof_admin',
        password: 'PROF_4DM1N!',
        role: 'professor',
        email: 'prof@university.edu',
      },
    ],
    contents: [
      {
        title: 'STU-001-CS401',
        body: JSON.stringify({
          studentId: 'STU-001',
          studentName: 'Omar Hassan',
          courseId: 'CS401',
          courseName: 'Advanced Web Security',
          currentGrade: 'C+',
          credits: 3,
        }),
        author: 'grade',
        isPublic: false,
      },
    ],
  },
};
