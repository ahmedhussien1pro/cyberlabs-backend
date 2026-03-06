// src/modules/practice-labs/business-logic/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab3Metadata: LabMetadata = {
  slug: 'blvuln-workflow-step-bypass',
  title: 'Business Logic: Workflow Step Bypass — Skip Email Verification',
  ar_title:
    'المنطق التجاري: تجاوز خطوات سير العمل — تخطي التحقق من البريد الإلكتروني',
  description:
    'Exploit a business logic flaw in a job application portal where the backend does not enforce sequential workflow order, allowing you to skip email verification and jump directly to the final hiring stage.',
  ar_description:
    'استغل خللاً في منطق الأعمال في بوابة التوظيف حيث لا يُطبّق الـ backend ترتيب سير العمل التسلسلي، مما يتيح لك تخطي التحقق من البريد الإلكتروني والانتقال مباشرة للمرحلة النهائية.',
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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Skip the mandatory email verification and background check steps in the job application workflow to directly access the "Final Offer" stage and retrieve the flag.',
  ar_goal:
    'تخطَّ خطوتَي التحقق من البريد الإلكتروني والفحص الأمني الإلزاميتَين في سير عمل طلب التوظيف للوصول مباشرة إلى مرحلة "العرض النهائي" واسترجاع العلم.',

  briefing: {
    en: `HireTrack is a digital recruitment platform used by top-tier tech companies.
The application process has 4 mandatory steps:
Step 1 → Submit Application
Step 2 → Email Verification  
Step 3 → Background Check
Step 4 → Final Offer
Each step is a separate API endpoint. You complete step 1 — you get your applicationId.
The system tells you: "Next step: email-verification."
The UI blocks you from jumping ahead.
But the UI is just... the UI.
The API endpoints exist independently.
Does the backend actually verify you completed step 2 before allowing step 3?
Or does it just check if the application exists?`,
    ar: `HireTrack هي منصة توظيف رقمية تستخدمها شركات تقنية من الدرجة الأولى.
عملية التقديم لها 4 خطوات إلزامية:
الخطوة 1 → تقديم الطلب
الخطوة 2 → التحقق من البريد الإلكتروني
الخطوة 3 → الفحص الأمني
الخطوة 4 → العرض النهائي
كل خطوة هي نقطة API منفصلة. تُكمل الخطوة 1 — تحصل على applicationId.
يخبرك النظام: "الخطوة التالية: التحقق من البريد الإلكتروني."
واجهة المستخدم تمنعك من القفز للأمام.
لكن واجهة المستخدم هي فقط... واجهة مستخدم.
نقاط الـ API موجودة باستقلالية.
هل يتحقق الـ backend فعلاً من إكمالك الخطوة 2 قبل السماح بالخطوة 3؟
أم أنه فقط يتحقق من وجود الطلب؟`,
  },

  stepsOverview: {
    en: [
      'Submit a new job application — receive your applicationId',
      'Observe the expected next step in the response',
      'Attempt to call a later workflow step endpoint directly, skipping intermediate steps',
      'Confirm the backend does not validate step completion order',
      'Jump directly to the Final Offer step and retrieve the flag',
    ],
    ar: [
      'قدّم طلب توظيف جديداً — احصل على applicationId',
      'لاحظ الخطوة التالية المتوقعة في الاستجابة',
      'حاول استدعاء نقطة خطوة سير عمل لاحقة مباشرة، متجاوزاً الخطوات الوسيطة',
      'أكّد أن الـ backend لا يتحقق من ترتيب إكمال الخطوات',
      'انتقل مباشرة إلى خطوة العرض النهائي واسترجع العلم',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'HireTrack application workflow. Each step is a POST endpoint: /application/:id/step/:stepName. The handler only checks if the application exists — it does NOT verify that all previous steps were completed. Any step can be called in any order after the application is created.',
    vulnerableCode:
      '// Step handler (vulnerable):\n' +
      "app.post('/application/:id/step/:step', async (req, res) => {\n" +
      '  const app = await db.applications.findOne({ id: req.params.id });\n' +
      "  if (!app) return res.status(404).json({ error: 'Application not found' });\n" +
      '  // ❌ No check: was the previous step completed?\n' +
      '  await db.applications.update({ id: app.id, currentStep: req.params.step });\n' +
      '  res.json({ success: true, step: req.params.step });\n' +
      '});',
    exploitation:
      'Step 1: POST /apply → get applicationId.\n' +
      'Step 2 (skip): Jump directly to POST /application/{id}/step/final-offer.\n' +
      'The backend advances the application to final offer without checking steps 2 and 3.',
    steps: {
      en: [
        'POST /apply with { "name": "John Doe", "email": "john@test.com" } → receive { applicationId: "APP-XXXX", nextStep: "email-verification" }',
        'Instead of following the email-verification step, directly call: POST /application/APP-XXXX/step/email-verification → succeeds, no verification actually sent',
        'Skip background check: POST /application/APP-XXXX/step/background-check → also succeeds with no actual check',
        'Jump to final: POST /application/APP-XXXX/step/final-offer → system grants the offer',
        'GET /application/APP-XXXX → status: "FINAL_OFFER", flag embedded in the offer letter',
      ],
      ar: [
        'POST /apply مع { "name": "John Doe", "email": "john@test.com" } → احصل على { applicationId: "APP-XXXX", nextStep: "email-verification" }',
        'بدلاً من اتباع خطوة التحقق من البريد، استدعِ مباشرة: POST /application/APP-XXXX/step/email-verification → ينجح، لا تحقق فعلي يُرسَل',
        'تخطَّ الفحص الأمني: POST /application/APP-XXXX/step/background-check → ينجح أيضاً بدون فحص فعلي',
        'انتقل للنهاية: POST /application/APP-XXXX/step/final-offer → يمنح النظام العرض',
        'GET /application/APP-XXXX → الحالة: "FINAL_OFFER"، العلم مضمَّن في خطاب العرض',
      ],
    },
    fix: [
      'Enforce step ordering: before processing step N, verify step N-1 is recorded as completed in the DB',
      'Use a state machine pattern: define allowed transitions (e.g., only SUBMITTED → EMAIL_VERIFIED, never SUBMITTED → FINAL_OFFER)',
      'Store completion status for each step separately and validate on every step request',
      'Never rely on frontend flow for business logic enforcement — treat each API call as independent',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Workflow Step Bypass exploits the gap between frontend flow enforcement and backend state validation. When a multi-step process only enforces order in the UI but not in the API, any step can be reached directly. The backend acts as if all previous steps were completed because it only checks if the resource exists, not the current state of the workflow.',
      ar: 'يستغل تجاوز خطوات سير العمل الفجوة بين تطبيق الترتيب في واجهة المستخدم والتحقق من الحالة في الـ backend. عندما يُطبّق عملية متعددة الخطوات الترتيب في واجهة المستخدم فقط دون في الـ API، يمكن الوصول إلى أي خطوة مباشرة. يتصرف الـ backend كأن جميع الخطوات السابقة مكتملة لأنه يتحقق فقط من وجود المورد، لا من الحالة الراهنة لسير العمل.',
    },
    impact: {
      en: 'In recruitment systems: fake "hired" status without real screening. In financial systems: fund transfers without mandatory approval steps. In compliance systems: regulatory step bypasses. The severity depends entirely on what the skipped steps protect against.',
      ar: 'في أنظمة التوظيف: حالة "مُوظَّف" مزيفة بدون فحص حقيقي. في الأنظمة المالية: تحويلات أموال بدون خطوات موافقة إلزامية. في أنظمة الامتثال: تجاوز خطوات تنظيمية. تعتمد الخطورة كلياً على ما تحميه الخطوات المتجاوَزة.',
    },
    fix: [
      'Backend state machine: store currentStep in DB, validate before any step transition',
      'Allowed transition map: { SUBMITTED: ["email-verification"], EMAIL_VERIFIED: ["background-check"], ... }',
      'Return 409 Conflict if step is called out of order',
      'Log and alert on out-of-order step attempts as potential abuse signals',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Submit your application and get an applicationId. The response says "nextStep: email-verification". What if you call a different step endpoint directly instead?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try POST /application/{id}/step/email-verification — does it actually send a verification email? Or does it just update a status field? What about calling background-check next?',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Jump directly from step 1 to step 4: POST /application/{id}/step/final-offer immediately after creating the application. The backend only checks if the application exists, not whether previous steps were completed.',
    },
  ],

  flagAnswer: 'FLAG{BL_WORKFLOW_BYPASS_SKIP_VERIFICATION_HIRED}',
  initialState: {},
};
