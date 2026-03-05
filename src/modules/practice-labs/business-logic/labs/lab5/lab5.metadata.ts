// src/modules/practice-labs/bl-vuln/labs/lab5/lab5.metadata.ts
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
  goal: 'Submit a salary raise request for yourself, then exploit the delegation/approval workflow to become the approver of your own request and approve it — resulting in an unauthorized salary increase.',
  scenario: {
    context:
      'PeopleCore HR System manages salary raise requests. Workflow: 1) Employee submits raise request → 2) Request goes to their direct manager for approval → 3) HR Admin final approval. Flaws: (A) The "delegate approver" feature allows setting any userId as approver without ownership check. (B) The approval endpoint only checks if requester is "an approver", not if they are the SAME PERSON who submitted.',
    vulnerableCode: `// Delegation (vulnerable):
app.post('/requests/:id/delegate', async (req, res) => {
  const { newApproverId } = req.body;
  // ❌ No check: is newApproverId the same as requesterId?
  await db.requests.update({ id: req.params.id, approverId: newApproverId });
  res.json({ success: true });
});

// Approval (vulnerable):
app.post('/requests/:id/approve', async (req, res) => {
  const request = await db.requests.findOne({ id: req.params.id });
  // ❌ Only checks if current user IS the approver, not self-approval!
  if (request.approverId !== req.user.id) return res.status(403).json({ error: 'Not the approver' });
  await db.requests.update({ id: req.params.id, status: 'APPROVED' });
});`,
    exploitation:
      '1. Submit a salary raise request (you become the requester). 2. Use the delegate endpoint to change the approverId to YOUR OWN userId. 3. Now you are both requester AND approver. 4. Approve your own request.',
  },
  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Submit a salary raise request. You get a requestId and the current approverId (your manager). The system needs manager approval.',
    },
    {
      order: 2,
      xpCost: 45,
      content:
        'Look for a "delegate approver" endpoint. This allows re-assigning the approver. Does it check if the new approver is the same person who submitted?',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /requests/{id}/delegate with { "newApproverId": "<YOUR_USER_ID>" }. Now you are the approver of your own request.',
    },
    {
      order: 4,
      xpCost: 95,
      content:
        'POST /requests/{id}/approve — since you are now the approver, the system approves it. Self-approval complete. Retrieve the flag from the approved request.',
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
