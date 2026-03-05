// src/modules/practice-labs/bl-vuln/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab3Metadata: LabMetadata = {
  slug: 'blvuln-workflow-step-bypass',
  title: 'Business Logic: Workflow Step Bypass — Skip Email Verification',
  ar_title:
    'المنطق التجاري: تجاوز خطوات سير العمل — تخطي التحقق من البريد الإلكتروني',
  description:
    'Exploit a business logic flaw in a job application portal where the backend does not enforce the sequential workflow order, allowing you to skip email verification and submit directly to the final hiring stage.',
  ar_description:
    'استغل خللًا في منطق الأعمال في بوابة التوظيف حيث لا يُطبّق الباكند ترتيب سير العمل التسلسلي، مما يتيح لك تخطي التحقق من البريد الإلكتروني والتقديم مباشرة للمرحلة النهائية.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Business Logic',
    'Workflow Bypass',
    'State Machine Exploitation',
    'API Abuse',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Skip the mandatory email verification and background check steps in the job application workflow to directly access the "Final Offer" stage and retrieve the flag.',
  scenario: {
    context:
      'HireTrack is a job application portal with a strict 4-step workflow: 1) Submit Application → 2) Email Verification → 3) Background Check → 4) Final Offer. Each step should require the previous one to be completed. However, the backend only checks if the application exists, NOT whether all previous steps were completed.',
    vulnerableCode: `// Step handler (vulnerable):
app.post('/application/:id/step/:step', async (req, res) => {
  const app = await db.applications.findOne({ id: req.params.id });
  if (!app) return res.status(404).json({ error: 'Application not found' });
  // ❌ No check: was the previous step completed?
  await db.applications.update({ id: app.id, currentStep: req.params.step });
  res.json({ success: true, step: req.params.step });
});`,
    exploitation:
      'After submitting your application (step 1), directly call step 4 (Final Offer) without completing steps 2 and 3. The backend will advance your application to the final stage without any validation of prior steps.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Submit your application to get an applicationId. The response includes the next expected step. What if you skip to a later step?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try calling POST /application/{id}/step/email-verification — this is step 2. Does it check if step 1 is truly complete?',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Jump directly from step 1 to step 4. Try POST /application/{id}/step/final-offer directly after creating the application.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'Full chain: POST /apply → get applicationId → POST /application/{id}/step/final-offer → The system grants you a job offer and reveals the flag.',
    },
  ],
  flagAnswer: 'FLAG{BL_WORKFLOW_BYPASS_SKIP_VERIFICATION_HIRED}',
  initialState: {},
};
