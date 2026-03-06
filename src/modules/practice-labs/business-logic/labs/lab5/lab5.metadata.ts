// src/modules/practice-labs/business-logic/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab5Metadata: LabMetadata = {
  slug: 'blvuln-self-approval-salary-raise',
  title: 'Business Logic: Self-Approval — Authorize Your Own Salary Raise',
  ar_title: 'المنطق التجاري: الموافقة الذاتية — اعتماد زيادة راتبك بنفسك',
  description:
    'Exploit a multi-step business logic vulnerability in an HR/Payroll system where an employee can manipulate the approval workflow to approve their own salary raise request by exploiting role assignment and delegation flaws.',
  ar_description:
    'استغل ثغرة منطق أعمال متعددة الخطوات في نظام الموارد البشرية والرواتب حيث يمكن للموظف التلاعب في سير عمل الموافقة لاعتماد طلب زيادة راتبه بنفسه باستغلال ثغرات تعيين الأدوار والتفويض.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Business Logic',
    'Multi-Step Exploitation',
    'Workflow Abuse',
    'Privilege Escalation',
    'Self-Reference Attack',
  ],
  xpReward: 400,
  pointsReward: 200,
  duration: 70,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Submit a salary raise request for yourself, then exploit the delegation/approval workflow to become the approver of your own request and approve it — resulting in an unauthorized salary increase.',
  ar_goal:
    'قدّم طلب زيادة راتب لنفسك، ثم استغل سير عمل التفويض/الموافقة لتصبح المعتمِد على طلبك الخاص وتوافق عليه — مما ينتج عنه زيادة راتب غير مصرّح بها.',

  briefing: {
    en: `PeopleCore — an enterprise HR and payroll management system.
As employee_john, you want a salary raise. The system has a formal workflow:
You submit a request → your manager (manager_sarah) approves → HR Admin final approval.
You submit the request. The system assigns manager_sarah as the approver.
You are stuck. You cannot approve your own raise.
Or can you?
The system allows managers to "delegate" approval to another person.
Convenient for when managers are on vacation.
But who can delegate? And to whom?
And does the delegation endpoint check if the new approver is the same person who originally submitted?`,
    ar: `PeopleCore — نظام متكامل لإدارة الموارد البشرية والرواتب.
بوصفك employee_john، تريد زيادة راتب. للنظام سير عمل رسمي:
تقدّم طلباً → يوافق مديرك (manager_sarah) → الموافقة النهائية من HR Admin.
تقدّم الطلب. يُعيّن النظام manager_sarah معتمِدة.
أنت عالق. لا يمكنك اعتماد زيادتك الخاصة.
أم يمكنك ذلك؟
يسمح النظام للمديرين بـ "تفويض" الموافقة لشخص آخر.
مناسب حين يكون المديرون في إجازة.
لكن من يمكنه التفويض؟ ولمن؟
وهل تتحقق نقطة التفويض من أن المعتمِد الجديد هو نفس الشخص الذي قدّم الطلب أصلاً؟`,
  },

  stepsOverview: {
    en: [
      'Submit a salary raise request as employee_john — observe the assigned approver',
      'Explore the delegation endpoint — understand its parameters and access control',
      'Test whether the delegation endpoint verifies that the new approver is not the original requester',
      'Delegate approval to your own userId — making yourself both requester and approver',
      'Approve your own raise request using the approval endpoint',
    ],
    ar: [
      'قدّم طلب زيادة راتب بوصفك employee_john — لاحظ المعتمِد المُعيَّن',
      'استكشف نقطة التفويض — افهم معاملاتها والتحكم في الوصول',
      'اختبر هل تتحقق نقطة التفويض من أن المعتمِد الجديد ليس مقدّم الطلب الأصلي',
      'فوّض الموافقة إلى userId الخاص بك — مما يجعلك مقدّم الطلب والمعتمِد في الوقت ذاته',
      'اعتمد طلب زيادتك الخاصة باستخدام نقطة الموافقة',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'PeopleCore HR System. The delegation endpoint accepts newApproverId without verifying it is not the original requester. The approval endpoint only checks if the current user IS the assigned approver — not whether a self-approval situation exists. Two flaws combine: unrestricted delegation + no self-approval guard.',
    vulnerableCode:
      '// Delegation (vulnerable):\n' +
      "app.post('/requests/:id/delegate', async (req, res) => {\n" +
      '  const { newApproverId } = req.body;\n' +
      '  // ❌ No check: is newApproverId the same as requesterId?\n' +
      '  await db.requests.update({ id: req.params.id, approverId: newApproverId });\n' +
      '  res.json({ success: true });\n' +
      '});\n\n' +
      '// Approval (vulnerable):\n' +
      "app.post('/requests/:id/approve', async (req, res) => {\n" +
      '  const request = await db.requests.findOne({ id: req.params.id });\n' +
      '  // ❌ Only checks if current user IS the approver, not self-approval!\n' +
      "  if (request.approverId !== req.user.id) return res.status(403).json({ error: 'Not the approver' });\n" +
      "  await db.requests.update({ id: req.params.id, status: 'APPROVED' });\n" +
      '});',
    exploitation:
      '1. POST /raise/submit { "amount": 50000 } → { requestId: "REQ-XXXX", approverId: "manager_sarah_id" }\n' +
      '2. POST /requests/REQ-XXXX/delegate { "newApproverId": "employee_john_id" } → { success: true }\n' +
      '   (No check: john is the requester AND now the approver)\n' +
      '3. POST /requests/REQ-XXXX/approve → { status: "APPROVED", flag: "FLAG{...}" }',
    steps: {
      en: [
        'POST /raise/submit { "requestedAmount": 50000 } → receive { requestId: "REQ-XXXX", currentApproverId: "manager_sarah_id" }',
        'Try approving directly: POST /requests/REQ-XXXX/approve → 403 "Not the approver." Confirms normal protection.',
        'Find the delegation endpoint: POST /requests/REQ-XXXX/delegate { "newApproverId": "employee_john_id" (your own ID) } → { success: true }',
        'Verify you are now the approver: GET /requests/REQ-XXXX → approverId = employee_john_id',
        'POST /requests/REQ-XXXX/approve → 200 { status: "APPROVED" } → flag returned in the approval response',
      ],
      ar: [
        'POST /raise/submit { "requestedAmount": 50000 } → احصل على { requestId: "REQ-XXXX", currentApproverId: "manager_sarah_id" }',
        'حاول الموافقة مباشرة: POST /requests/REQ-XXXX/approve → 403 "لست المعتمِد." يؤكد الحماية الطبيعية.',
        'ابحث عن نقطة التفويض: POST /requests/REQ-XXXX/delegate { "newApproverId": "employee_john_id" (معرفك الخاص) } → { success: true }',
        'تحقق من أنك أصبحت المعتمِد: GET /requests/REQ-XXXX → approverId = employee_john_id',
        'POST /requests/REQ-XXXX/approve → 200 { status: "APPROVED" } → يُرجَع العلم في استجابة الموافقة',
      ],
    },
    fix: [
      'Delegation: enforce self-referential prevention: if (newApproverId === request.requesterId) return 403 "Cannot delegate to yourself"',
      'Approval: add self-approval guard: if (req.user.id === request.requesterId) return 403 "Cannot approve your own request"',
      'Separation of duties: at a schema level, store requesterId separately and reference it in all approval checks',
      'Audit log: flag and alert whenever the requester and approver of the same request are identical',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Self-Approval attacks exploit workflows that lack separation-of-duties enforcement. By combining two subtle flaws — unrestricted delegation (no check that newApprover ≠ requester) and an approval check that only verifies role assignment (not self-reference) — an attacker can become both the requester and approver of the same request. This is a real-world pattern found in financial, HR, and compliance systems.',
      ar: 'تستغل هجمات الموافقة الذاتية سير العمل الذي يفتقر إلى تطبيق مبدأ الفصل بين المهام. بالجمع بين ثغرتَين دقيقتَين — التفويض غير المقيَّد (لا يوجد تحقق من أن المعتمِد الجديد ≠ مقدّم الطلب) وفحص الموافقة الذي يتحقق فقط من تعيين الدور (لا المرجع الذاتي) — يمكن للمهاجم أن يصبح مقدّم الطلب والمعتمِد في آنٍ واحد. هذا نمط حقيقي موجود في الأنظمة المالية وموارد البشرية وأنظمة الامتثال.',
    },
    impact: {
      en: 'Unauthorized financial approvals, unlimited self-granted pay raises, fraudulent expense reports, and bypassed compliance workflows. In enterprise HR systems, this can result in millions in unauthorized payroll fraud that may go undetected for months.',
      ar: 'موافقات مالية غير مصرّح بها، وزيادات رواتب ذاتية غير محدودة، وتقارير مصروفات احتيالية، وتجاوز سير عمل الامتثال. في أنظمة HR المؤسسية، يمكن أن يؤدي هذا إلى ملايين في احتيال الرواتب غير المصرّح به الذي قد يمر دون اكتشاف لأشهر.',
    },
    fix: [
      'Hard rule: requester and approver must never be the same person — enforce at every approval step',
      'Delegation whitelist: only allow delegation to users in a predefined approver pool',
      'Immutable requester field: once a request is created, its requesterId cannot be used as approverId',
      'Dual-control for sensitive approvals: require two independent approvers for high-value requests',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Submit a salary raise request — you get a requestId and the current approverId (manager_sarah). Try approving it directly as yourself: POST /requests/{id}/approve → 403. What would change if you were the assigned approver?',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'Find the delegation endpoint: POST /requests/{id}/delegate. It lets you change the assigned approver. Does it check if the new approver is the same person who submitted the request?',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /requests/{id}/delegate with { "newApproverId": "<YOUR_OWN_USER_ID>" }. If it succeeds, you are now the approver of your own request. Then POST /requests/{id}/approve.',
    },
  ],

  flagAnswer: 'FLAG{BL_SELF_APPROVAL_HR_SALARY_RAISE_EXPLOITED}',
  initialState: {
    users: [
      { username: 'employee_john', password: 'john123', role: 'employee' },
      { username: 'manager_sarah', password: 'sarahpass', role: 'manager' },
      { username: 'hr_admin', password: 'HR_4DM1N!', role: 'hr_admin' },
    ],
  },
};
