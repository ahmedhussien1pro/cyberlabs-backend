// src/modules/practice-labs/ac-vuln/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab1Metadata: LabMetadata = {
  slug: 'acvuln-idor-healthcare-records',
  title: 'IDOR: Healthcare Patient Records Leak',
  ar_title: 'IDOR: تسريب السجلات الطبية للمرضى',
  description:
    "Exploit an Insecure Direct Object Reference vulnerability in a healthcare portal to access other patients' medical records by manipulating the patientId parameter.",
  ar_description:
    'استغل ثغرة IDOR في بوابة الرعاية الصحية للوصول إلى السجلات الطبية لمرضى آخرين عن طريق التلاعب بمعامل patientId.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'IDOR',
    'Access Control',
    'Parameter Tampering',
    'Horizontal Privilege Escalation',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Access the confidential medical record of patient "Dr. Sarah Chen" (patientId: HC-VIP-2026) to retrieve the flag hidden in her diagnosis notes.',
  ar_goal:
    'صل إلى السجل الطبي السري للمريضة "Dr. Sarah Chen" (patientId: HC-VIP-2026) واسترجع العلم المخفي في ملاحظات التشخيص.',

  briefing: {
    en: `MedCore is a hospital patient portal serving thousands of patients across the city.
You just registered as a new patient — John Doe. After login, you're directed to your medical profile.
The system lets you view your own records via a simple URL parameter.
Simple, clean, standard web design.
But there's one thing you notice: the URL contains your patient ID in plain sight.
HC-1001. Yours.
The hospital director — a VIP patient — has records in this same system.
Different ID. Same endpoint.
Does the system actually verify the ID belongs to you?`,
    ar: `MedCore هي بوابة مرضى مستشفى تخدم آلاف المرضى في المدينة.
سجّلت للتو كمريض جديد — John Doe. بعد تسجيل الدخول، وُجِّهت إلى ملفك الطبي.
يتيح لك النظام عرض سجلاتك الخاصة عبر معامل URL بسيط.
بسيط، نظيف، تصميم ويب قياسي.
لكن هناك شيء تلاحظه: الـ URL يحتوي على معرف مريضك بشكل واضح.
HC-1001. معرفك.
مديرة المستشفى — مريضة VIP — لديها سجلات في هذا النظام نفسه.
معرف مختلف. نقطة نهاية واحدة.
هل النظام يتحقق فعلاً من أن المعرف يخصك؟`,
  },

  stepsOverview: {
    en: [
      'Log in and observe the URL parameter used to fetch your own medical record',
      'Test whether the system verifies that the requested patient ID belongs to you',
      'Enumerate different patient ID formats to understand the naming conventions',
      'Identify the VIP patient ID format and request their record directly',
    ],
    ar: [
      'سجّل الدخول ولاحظ معامل URL المستخدم لجلب سجلك الطبي الخاص',
      'اختبر هل النظام يتحقق من أن معرف المريض المطلوب يخصك',
      'عدّد صيغ معرفات المرضى المختلفة لفهم اصطلاحات التسمية',
      'حدد صيغة معرف مريض VIP واطلب سجلها مباشرة',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "Hospital patient portal backend fetches records by patientId from the URL query parameter without verifying if the patientId belongs to the authenticated user. Any authenticated patient can access any other patient's record by changing the patientId.",
    vulnerableCode:
      '// Backend fetches record by patientId from URL:\n' +
      'const { patientId } = req.query;\n' +
      'const record = await db.findRecord({ patientId });\n' +
      '// ❌ No authorization check: does patientId belong to current user?\n' +
      'res.json(record);',
    exploitation:
      'Change the patientId parameter from HC-1001 (your ID) to HC-VIP-2026 (Dr. Sarah Chen). The backend returns her record without checking ownership. Classic IDOR: trusting client-supplied object IDs without server-side ownership verification.',
    steps: {
      en: [
        'Log in as John Doe. Request: GET /records?patientId=HC-1001 → your own record loads correctly',
        'Observe the URL — patientId is visible and client-controlled',
        "Test with adjacent IDs: GET /records?patientId=HC-1002 → Alice Johnson's record appears. No error. No ownership check.",
        "Try VIP format: GET /records?patientId=HC-VIP-2026 → Dr. Sarah Chen's record loads",
        'Read the diagnosis field → the flag is embedded as a confidential note',
      ],
      ar: [
        'سجّل الدخول بوصفك John Doe. الطلب: GET /records?patientId=HC-1001 → يُحمَّل سجلك الخاص بشكل صحيح',
        'لاحظ الـ URL — patientId مرئي وخاضع لسيطرة العميل',
        'اختبر بمعرفات متجاورة: GET /records?patientId=HC-1002 → يظهر سجل Alice Johnson. لا خطأ. لا تحقق من الملكية.',
        'جرّب صيغة VIP: GET /records?patientId=HC-VIP-2026 → يُحمَّل سجل Dr. Sarah Chen',
        'اقرأ حقل التشخيص → العلم مضمَّن كملاحظة سرية',
      ],
    },
    fix: [
      'Always verify resource ownership server-side: if (record.patientId !== req.user.patientId) return 403',
      'Never trust client-supplied resource IDs for authorization decisions',
      'Use indirect reference maps: map user-visible IDs to internal IDs server-side',
      'Implement automated IDOR testing in your CI/CD pipeline',
    ],
  },

  postSolve: {
    explanation: {
      en: "IDOR (Insecure Direct Object Reference) occurs when an application uses user-controllable identifiers to directly access database objects without verifying ownership or authorization. Even authenticated users can access other users' data by simply changing the ID in the request.",
      ar: 'تحدث ثغرة IDOR عندما يستخدم التطبيق معرفات يتحكم فيها المستخدم للوصول المباشر إلى كائنات قاعدة البيانات دون التحقق من الملكية أو التفويض. حتى المستخدمون المصادَق عليهم يمكنهم الوصول إلى بيانات مستخدمين آخرين بمجرد تغيير المعرف في الطلب.',
    },
    impact: {
      en: 'Complete breach of patient confidentiality (PHI). In real healthcare systems, this violates HIPAA and exposes diagnoses, medications, and sensitive personal health data for all patients in the system.',
      ar: 'خرق كامل لسرية بيانات المرضى (PHI). في أنظمة الرعاية الصحية الحقيقية، يُخل هذا بـ HIPAA ويكشف التشخيصات والأدوية والبيانات الصحية الشخصية الحساسة لجميع المرضى في النظام.',
    },
    fix: [
      'Server-side ownership check on every resource access',
      'Use UUIDs instead of sequential IDs to reduce enumerability',
      'Principle of least privilege: scope all DB queries to the authenticated user',
      'Access control tests as part of every API endpoint test suite',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'When you load your own medical record, notice the URL parameter: ?patientId=HC-1001. What happens if you change this to a different patient ID?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try sequential IDs: HC-1002, HC-1003. Some return "Record not found", but others return valid records — confirming the server never checks ownership.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'The target is Dr. Sarah Chen, a VIP patient. Hospital VIP IDs often follow a different pattern: HC-VIP-XXXX. Try HC-VIP-2026.',
    },
  ],

  flagAnswer: 'FLAG{IDOR_HEALTHCARE_PHI_LEAK_2026}',
  initialState: {
    contents: [
      {
        title: 'HC-1001',
        body: JSON.stringify({
          patientName: 'John Doe',
          dob: '1990-05-15',
          diagnosis: 'Annual checkup — all vitals normal',
          lastVisit: '2026-02-20',
          physician: 'Dr. Michael Roberts',
        }),
        author: 'patient',
        isPublic: false,
      },
      {
        title: 'HC-1002',
        body: JSON.stringify({
          patientName: 'Alice Johnson',
          dob: '1985-08-22',
          diagnosis: 'Seasonal flu — prescribed rest and fluids',
          lastVisit: '2026-03-01',
          physician: 'Dr. Emily Carter',
        }),
        author: 'patient',
        isPublic: false,
      },
      {
        title: 'HC-VIP-2026',
        body: JSON.stringify({
          patientName: 'Dr. Sarah Chen',
          dob: '1978-11-03',
          diagnosis:
            'Confidential: Executive health screening — FLAG{IDOR_HEALTHCARE_PHI_LEAK_2026}',
          lastVisit: '2026-02-28',
          physician: 'Dr. Hospital Director (Self)',
          classification: 'VIP - Restricted Access',
        }),
        author: 'vip',
        isPublic: false,
      },
    ],
  },
};
