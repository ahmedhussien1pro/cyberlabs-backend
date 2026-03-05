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
  goal: "The university portal uses SameSite=Lax cookies. The grade update endpoint incorrectly uses GET. Exploit the Lax bypass: a cross-site top-level GET navigation sends cookies — use this to change a student's grade to A+.",
  scenario: {
    context:
      'UniTrack student portal uses SameSite=Lax session cookies — the developer thought this was sufficient CSRF protection. However, the /grades/update endpoint was lazily implemented as a GET request (for "easy testing"). SameSite=Lax allows cookies on cross-site top-level navigations (like clicking a link or redirect), so a simple <a href> or redirect attack bypasses Lax protection on GET endpoints.',
    vulnerableCode: `// Grade update (vulnerable — GET request changes state!):
app.get('/grades/update', isAuthenticated, async (req, res) => {
  const { studentId, courseId, grade } = req.query;
  // ❌ GET request modifying state = CSRF via Lax bypass
  // ❌ SameSite=Lax does NOT protect GET state-change endpoints
  await db.grades.update({ studentId, courseId, grade });
  res.json({ success: true });
});`,
    exploitation:
      "Craft a URL: GET /grades/update?studentId=STU-001&courseId=CS401&grade=A+. Send this as a top-level navigation (link, redirect, window.location). SameSite=Lax allows cookies on top-level GET navigation — the request succeeds with the victim's session.",
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'The portal uses SameSite=Lax. This blocks CSRF on POST but NOT on GET top-level navigation. Check if any state-changing action uses GET.',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Find the /grades/update endpoint. It uses GET with query parameters. SameSite=Lax allows cookies when the user navigates directly to a URL.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Use /csrf/simulate-victim-navigation to simulate a top-level GET navigation. Pass the grade update URL as the target.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'POST /csrf/simulate-victim-navigation with { "targetPath": "/grades/update", "params": { "studentId": "STU-001", "courseId": "CS401", "grade": "A+" } }',
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
