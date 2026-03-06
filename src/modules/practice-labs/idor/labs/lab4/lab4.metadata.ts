// src/modules/practice-labs/idor/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab4Metadata: LabMetadata = {
  slug: 'idor-mass-assignment-bug-tracker',
  title: 'IDOR + Mass Assignment: Bug Tracker — Escalate to Project Admin',
  ar_title: 'IDOR + التعيين الجماعي: متتبع الأخطاء — التصعيد إلى مسؤول المشروع',
  description:
    'Chain an IDOR vulnerability with a mass assignment flaw in a bug tracker. First access private project issues via IDOR, then exploit mass assignment in the issue update endpoint to escalate your role to project admin.',
  ar_description:
    'سلسل ثغرة IDOR مع خلل في التعيين الجماعي في متتبع الأخطاء. استخدم أولاً IDOR للوصول إلى مشاكل المشروع الخاصة، ثم استغل التعيين الجماعي في endpoint تحديث المشكلة للتصعيد إلى مسؤول المشروع.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'IDOR',
    'Mass Assignment',
    'Privilege Escalation',
    'Chained Vulnerabilities',
    'API Security',
  ],
  xpReward: 330,
  pointsReward: 165,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: '1) Use IDOR to access a private project\'s issues. 2) Find an issue update endpoint that mass-assigns all body fields. 3) Inject a "projectRole: admin" field to escalate your membership. 4) Access the admin-only project settings to retrieve the flag.',
  ar_goal:
    '1) استخدم IDOR للوصول إلى مشاكل المشروع الخاصة. 2) ابحث عن endpoint تحديث المشكلة الذي يُعيّن جميع حقول الـ body. 3) احقن حقل "projectRole: admin" لتصعيد عضويتك. 4) صل إلى إعدادات المشروع الخاصة بالأدمن لاسترداد العلم.',

  briefing: {
    en: `BugFlow — project management and bug tracking. Enterprise-grade. Used by 500+ companies.
You are reporter_john. Viewer on Project ALPHA.
You can see your issues: ISS-301. Login button misaligned. Low priority.
You try ISS-302.
BETA project. Private. Another team's issue.
API rate limit not enforced.
The server gave it to you.
No membership check. No project permission.
Now you find the issue update endpoint.
POST /issues/ISS-305/update
You send: { "title": "Updated title" }
The response includes all issue fields.
Including... projectRole.
What if you send: { "title": "Updated", "projectRole": "admin" }?`,
    ar: `BugFlow — إدارة المشاريع وتتبع الأخطاء. على مستوى المؤسسات. يستخدمه أكثر من 500 شركة.
أنت reporter_john. مشاهد في مشروع ALPHA.
يمكنك رؤية مشاكلك: ISS-301. زر تسجيل الدخول غير محاذٍ. أولوية منخفضة.
تحاول ISS-302.
مشروع BETA. خاص. مشكلة فريق آخر.
حد معدل API غير مُطبَّق.
الخادم أعطاه لك.
لا فحص عضوية. لا إذن مشروع.
الآن تجد endpoint تحديث المشكلة.
POST /issues/ISS-305/update
ترسل: { "title": "عنوان محدَّث" }
الاستجابة تتضمن جميع حقول المشكلة.
بما فيها... projectRole.
ماذا لو أرسلت: { "title": "Updated"، "projectRole": "admin" }؟`,
  },

  stepsOverview: {
    en: [
      'Step 1 — IDOR: Access ISS-302 through ISS-305, confirm no project membership check',
      'Step 2 — Discovery: Call POST /issues/ISS-305/update with a normal title update — observe all fields in response including projectRole',
      'Step 3 — Mass Assignment: Inject { "projectRole": "admin" } in the update body',
      'Step 4 — Escalation: Verify your role is now admin via GET /project/membership',
      'Step 5 — Flag: POST /project/settings — admin-only endpoint returns the flag',
    ],
    ar: [
      'الخطوة 1 — IDOR: صل إلى ISS-302 إلى ISS-305، أكّد غياب فحص عضوية المشروع',
      'الخطوة 2 — الاكتشاف: استدعِ POST /issues/ISS-305/update بتحديث عنوان عادي — لاحظ جميع الحقول في الاستجابة بما فيها projectRole',
      'الخطوة 3 — التعيين الجماعي: احقن { "projectRole": "admin" } في جسم التحديث',
      'الخطوة 4 — التصعيد: تحقق أن دورك أصبح admin عبر GET /project/membership',
      'الخطوة 5 — العلم: POST /project/settings — endpoint الخاص بالأدمن يُعيد العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'BugFlow has two chained vulnerabilities: (1) IDOR on issue fetch — no project membership check allows access to any issue. (2) Mass Assignment on issue update — Object.assign(issue, req.body) blindly copies all request body fields including projectRole, allowing privilege escalation from reporter to admin.',
    vulnerableCode:
      '// Issue fetch (IDOR):\n' +
      "app.post('/issues/:id/view', auth, async (req, res) => {\n" +
      '  const issue = await db.issues.findOne({ id: req.params.id });\n' +
      '  // ❌ No project membership check\n' +
      '  res.json(issue);\n' +
      '});\n\n' +
      '// Issue update (Mass Assignment):\n' +
      "app.post('/issues/:id/update', auth, async (req, res) => {\n" +
      '  const issue = await db.issues.findOne({ id: req.params.id });\n' +
      '  // ❌ Assigns ALL body fields including sensitive ones!\n' +
      '  Object.assign(issue, req.body);\n' +
      '  await db.issues.save(issue);\n' +
      '  res.json(issue);\n' +
      '});',
    exploitation:
      '1. POST /issues/ISS-303/view → private BETA issue returned → IDOR confirmed.\n' +
      '2. POST /issues/ISS-305/update { "title": "test", "projectRole": "admin" } → response shows projectRole: "admin" assigned.\n' +
      '3. POST /project/settings → admin-only → flag returned.',
    steps: {
      en: [
        'POST /issues/ISS-302/view → BETA project private issue returned → IDOR confirmed',
        'POST /issues/ISS-305/update { "title": "normal update" } → response: { ...issue, projectRole: "reporter" } — field visible!',
        'POST /issues/ISS-305/update { "title": "exploit", "projectRole": "admin" } → response: { ...issue, projectRole: "admin" } — escalated!',
        'POST /project/settings → you are now admin → flag: FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
      ],
      ar: [
        'POST /issues/ISS-302/view → مشكلة مشروع BETA الخاصة مُعادة → تم تأكيد IDOR',
        'POST /issues/ISS-305/update { "title": "تحديث عادي" } → الاستجابة: { ...issue، projectRole: "reporter" } — الحقل مرئي!',
        'POST /issues/ISS-305/update { "title": "exploit"، "projectRole": "admin" } → الاستجابة: { ...issue، projectRole: "admin" } — تم التصعيد!',
        'POST /project/settings → أنت الآن admin → العلم: FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
      ],
    },
    fix: [
      'IDOR fix: verify project membership before returning any issue: if (!project.members.includes(req.user.id)) return 403',
      'Mass Assignment fix: use explicit field allowlists — never Object.assign(model, req.body)',
      'Correct pattern: const { title, description, priority } = req.body — only extract known-safe fields',
      'Sensitive fields (role, permissions, isAdmin) must ONLY be modified through dedicated, separately authorized endpoints',
    ],
  },

  postSolve: {
    explanation: {
      en: "Vulnerability chaining is a key skill for advanced penetration testing. Individually, IDOR (accessing another project's issue) and Mass Assignment (injecting extra fields) might be rated medium severity. Together, they enable full privilege escalation. Real-world critical vulnerabilities are often chains of 2-3 medium-severity flaws that together achieve a high-impact outcome.",
      ar: 'تسلسل الثغرات مهارة رئيسية للاختبار المتقدم. بشكل فردي، IDOR (الوصول إلى مشكلة مشروع آخر) والتعيين الجماعي (حقن حقول إضافية) قد يُصنَّفان خطورة متوسطة. معاً، يُمكّنان من تصعيد كامل للصلاحيات. الثغرات الحرجة في العالم الحقيقي غالباً ما تكون سلاسل من 2-3 عيوب متوسطة الخطورة تحقق معاً نتيجة عالية التأثير.',
    },
    impact: {
      en: "Full project admin access: read all private issues across all projects (information disclosure), escalate your role on any project (privilege escalation), access project settings and secrets, modify or delete other users' issues.",
      ar: 'وصول كامل لأدمن المشروع: قراءة جميع المشاكل الخاصة عبر جميع المشاريع (إفصاح معلومات)، تصعيد دورك على أي مشروع (تصعيد صلاحيات)، الوصول إلى إعدادات المشروع وأسراره، تعديل أو حذف مشاكل المستخدمين الآخرين.',
    },
    fix: [
      "Defense in depth: fix both vulnerabilities independently — don't assume fixing one makes the chain impossible",
      'Object-level auth: check project membership for EVERY issue endpoint, not just fetch',
      'Input allowlisting: define updateIssueDto with only user-modifiable fields — framework DTOs (NestJS, Express-Validator) enforce this automatically',
      'Security testing: include chained vulnerability scenarios in your pentest scope',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'You are a viewer on Project ALPHA. Your issue ID is ISS-301. Try accessing ISS-302, ISS-303 — do you get private issues from other projects? This is the first vulnerability.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Now try updating an issue via POST /issues/{id}/update with a simple title change. Look at the full response — what fields are returned? Is "projectRole" among them?',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'POST /issues/ISS-305/update with body: { "title": "test", "projectRole": "admin" }. Check the response — did your role change? Now try POST /project/settings.',
    },
  ],

  flagAnswer: 'FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
  initialState: {
    users: [
      { username: 'reporter_john', password: 'john123', role: 'reporter' },
      { username: 'admin_bugflow', password: 'BUG_ADM1N!', role: 'admin' },
    ],
    contents: [
      {
        title: 'ISS-301',
        body: JSON.stringify({
          title: 'Login button misaligned',
          priority: 'low',
          project: 'ALPHA',
          isPrivate: false,
          projectRole: 'reporter',
        }),
        author: 'issue',
        isPublic: true,
      },
      {
        title: 'ISS-302',
        body: JSON.stringify({
          title: 'Search returns wrong results',
          priority: 'medium',
          project: 'BETA',
          isPrivate: true,
          projectRole: 'reporter',
        }),
        author: 'issue',
        isPublic: false,
      },
      {
        title: 'ISS-303',
        body: JSON.stringify({
          title: 'API rate limit not enforced',
          priority: 'high',
          project: 'GAMMA',
          isPrivate: true,
          projectRole: 'reporter',
        }),
        author: 'issue',
        isPublic: false,
      },
      {
        title: 'ISS-304',
        body: JSON.stringify({
          title: 'Password stored in plaintext',
          priority: 'critical',
          project: 'DELTA',
          isPrivate: true,
          projectRole: 'reporter',
        }),
        author: 'issue',
        isPublic: false,
      },
      {
        title: 'ISS-305',
        body: JSON.stringify({
          title: 'Admin panel accessible without 2FA',
          priority: 'critical',
          project: 'ALPHA',
          isPrivate: false,
          projectRole: 'reporter',
          flag: 'FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
        }),
        author: 'issue_target',
        isPublic: false,
      },
    ],
  },
};
