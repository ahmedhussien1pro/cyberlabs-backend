// src/modules/practice-labs/idor/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab4Metadata: LabMetadata = {
  slug: 'idor-mass-assignment-bug-tracker',
  title: 'IDOR + Mass Assignment: Bug Tracker — Escalate to Project Admin',
  ar_title: 'IDOR + التعيين الجماعي: متتبع الأخطاء — التصعيد إلى مسؤول المشروع',
  description:
    'Chain an IDOR vulnerability with a mass assignment flaw in a bug tracker. First access private project issues via IDOR, then exploit mass assignment in the issue update endpoint to escalate your role to project admin.',
  ar_description:
    'سلسل ثغرة IDOR مع خلل في التعيين الجماعي في متتبع الأخطاء. استخدم أولاً IDOR للوصول إلى مشاكل المشروع الخاصة، ثم استغل التعيين الجماعي في endpoint تحديث المشكلة للتصعيد إلى مسؤول المشروع والوصول للإعدادات السرية.',
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
  goal: '1) Use IDOR to access a private project\'s issues. 2) Find an issue update endpoint that mass-assigns all body fields. 3) Inject a "projectRole: admin" field to escalate your membership. 4) Access the admin-only project settings to retrieve the flag.',
  scenario: {
    context:
      'BugFlow is a project management & bug tracking platform. You are a reporter (viewer) on Project ALPHA. The /issues/{issueId} endpoint has no ownership check. The /issues/{issueId}/update endpoint uses Object.assign(issue, req.body) — a mass assignment flaw — allowing injection of any field including membership role.',
    vulnerableCode: `// Issue fetch (IDOR):
app.post('/issues/:id/view', auth, async (req, res) => {
  const issue = await db.issues.findOne({ id: req.params.id });
  // ❌ No project membership check
  res.json(issue);
});

// Issue update (Mass Assignment):
app.post('/issues/:id/update', auth, async (req, res) => {
  const issue = await db.issues.findOne({ id: req.params.id });
  // ❌ Assigns ALL body fields including sensitive ones!
  Object.assign(issue, req.body);
  await db.issues.save(issue);
  res.json(issue);
});`,
    exploitation:
      '1. Access private issues via IDOR (change issueId from ISS-301). 2. In the update body, include { "title": "updated", "projectRole": "admin" }. 3. The server assigns your role as admin. 4. Access /project/settings to get the flag.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'You are a viewer on Project ALPHA. Your issue ID is ISS-301. Try accessing ISS-302, ISS-303 — are private issues from other projects visible?',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Found a private issue? Now try updating it via POST /issues/{id}/update. Send extra fields that shouldn\'t be user-writable, like "projectRole".',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'POST /issues/ISS-305/update with body: { "title": "test", "projectRole": "admin" }. Check your project role in the response.',
    },
    {
      order: 4,
      xpCost: 90,
      content:
        'After escalating to admin, POST /project/settings. This endpoint is restricted to admins and contains the flag.',
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
          title: 'Password stored in plaintext — CRITICAL',
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
