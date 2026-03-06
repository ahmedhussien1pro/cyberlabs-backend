// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab4Metadata: LabMetadata = {
  slug: 'acvuln-multistep-idor-documents',
  title: 'Multi-Step IDOR: Corporate Document Leak',
  ar_title: 'IDOR متعدد الخطوات: تسريب وثائق الشركة',
  description:
    'Exploit a multi-step IDOR vulnerability in a corporate document management system. First enumerate document IDs, then exploit a separate download endpoint that lacks authorization checks.',
  ar_description:
    'استغل ثغرة IDOR متعددة الخطوات في نظام إدارة وثائق الشركة. أولاً عدّد معرفات الوثائق، ثم استغل نقطة تحميل منفصلة تفتقر إلى فحوصات التفويض.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Multi-Step IDOR',
    'Enumeration',
    'File Access Control',
    'Path Traversal via IDOR',
  ],
  xpReward: 300,
  pointsReward: 150,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Access the confidential M&A document "Acquisition_Plan_Q2_2026_CONFIDENTIAL.pdf" by exploiting two separate IDOR vulnerabilities: one in document listing and one in document download.',
  ar_goal:
    'صل إلى وثيقة الاستحواذ السرية "Acquisition_Plan_Q2_2026_CONFIDENTIAL.pdf" باستغلال ثغرتَي IDOR منفصلتَين: واحدة في قائمة الوثائق وأخرى في نقطة التحميل.',

  briefing: {
    en: `MegaCorp — a Fortune 500 company — runs an internal document portal for all departments.
You're an employee with access to your own documents: HR forms, team meeting notes.
The portal has a /documents/mine endpoint for your files and a /documents/download/:docId endpoint for downloading.
There's also a /documents/all endpoint — you get 403 when you try it. Obviously restricted.
But 403 doesn't always mean silent.
Sometimes a blocked endpoint still talks.
What's in the error response? Just a message?
Look closer.`,
    ar: `MegaCorp — شركة Fortune 500 — تشغّل بوابة وثائق داخلية لجميع الأقسام.
أنت موظف لديك وصول لوثائقك الخاصة: نماذج HR وملاحظات اجتماعات الفريق.
للبوابة نقطة /documents/mine لملفاتك ونقطة /documents/download/:docId للتحميل.
هناك أيضاً نقطة /documents/all — تحصل على 403 حين تحاولها. مقيّدة بوضوح.
لكن 403 لا يعني الصمت دائماً.
أحياناً تتكلم نقطة النهاية المحجوبة.
ما الذي يوجد في استجابة الخطأ؟ مجرد رسالة؟
انظر بتمعن أكثر.`,
  },

  stepsOverview: {
    en: [
      'List your own documents via /documents/mine — observe the document ID format',
      'Attempt /documents/all — receive 403, but examine the full response body carefully',
      'Extract any document IDs or metadata leaked in the 403 error response',
      'Use the leaked document IDs with the /documents/download/:docId endpoint',
      'Discover that download has no ownership check — access the confidential document',
    ],
    ar: [
      'اعرض وثائقك الخاصة عبر /documents/mine — لاحظ صيغة معرف الوثيقة',
      'حاول /documents/all — احصل على 403، لكن افحص جسم الاستجابة الكامل بعناية',
      'استخرج أي معرفات وثائق أو بيانات وصفية مُسرَّبة في استجابة خطأ 403',
      'استخدم معرفات الوثائق المُسرَّبة مع نقطة /documents/download/:docId',
      'اكتشف أن نقطة التحميل لا تتحقق من الملكية — صل إلى الوثيقة السرية',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'MegaCorp document portal. Listing endpoint (/documents/mine) is safe — filtered by userId. Download endpoint (/documents/download/:docId) trusts the docId with no ownership check. The /documents/all endpoint returns 403 but leaks document IDs in the error response body (totalDocuments + recentIds array). Two-step attack: recon via error leak → download via unprotected endpoint.',
    vulnerableCode:
      '// Listing endpoint (safe):\n' +
      'GET /documents/mine → filters by userId ✅\n\n' +
      '// All documents endpoint (leaks metadata in 403):\n' +
      'GET /documents/all → 403, but response includes: { recentIds: ["DOC-CONF-2026-Q2", ...] } ❌\n\n' +
      '// Download endpoint (vulnerable):\n' +
      'GET /documents/download/:docId\n' +
      'const doc = await db.documents.findById(docId);\n' +
      '// ❌ No ownership check\n' +
      'res.download(doc.filePath);',
    exploitation:
      'Step 1: GET /documents/all → 403, but response body contains: { "error": "Forbidden", "recentIds": ["DOC-CONF-2026-Q2"] }.\n' +
      'Step 2: GET /documents/download/DOC-CONF-2026-Q2 → returns confidential document content with embedded flag.',
    steps: {
      en: [
        'GET /documents/mine → see DOC-1001 and DOC-1002, both yours',
        'GET /documents/all → 403 Forbidden. But read the full response body: it contains "recentIds": ["DOC-1001", "DOC-1002", "DOC-CONF-2026-Q2"]',
        'Note the ID: DOC-CONF-2026-Q2 — this is not in your /mine list',
        'GET /documents/download/DOC-CONF-2026-Q2 → returns document content',
        'Read the body — find the executive summary with the embedded flag',
      ],
      ar: [
        'GET /documents/mine → ترى DOC-1001 وDOC-1002، كلاهما لك',
        'GET /documents/all → 403 Forbidden. لكن اقرأ جسم الاستجابة الكامل: يحتوي على "recentIds": ["DOC-1001", "DOC-1002", "DOC-CONF-2026-Q2"]',
        'لاحظ المعرف: DOC-CONF-2026-Q2 — هذا ليس في قائمة /mine الخاصة بك',
        'GET /documents/download/DOC-CONF-2026-Q2 → يُرجع محتوى الوثيقة',
        'اقرأ الـ body — ابحث عن الملخص التنفيذي مع العلم المضمَّن',
      ],
    },
    fix: [
      'Download endpoint: always verify ownership: if (doc.author !== req.user.username) return 403',
      'Error responses must NEVER leak internal IDs, counts, or metadata — return only generic error messages',
      'Apply the same authorization logic consistently across listing AND download endpoints',
      'Security audit: review all endpoints that expose resource IDs for information disclosure',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Multi-Step IDOR chains two separate vulnerabilities: an information disclosure in a blocked endpoint (leaking IDs in a 403 response) and an authorization bypass in a separate download endpoint. Neither vulnerability alone would be sufficient — the attacker needs both to complete the attack. This pattern is common in complex applications and often missed in security reviews that test endpoints in isolation.',
      ar: 'تربط ثغرة IDOR متعددة الخطوات بين ثغرتَين منفصلتَين: إفصاح عن معلومات في نقطة نهاية محجوبة (تسريب المعرفات في استجابة 403) وتجاوز تفويض في نقطة تحميل منفصلة. لا تكفي أي ثغرة منهما وحدها — يحتاج المهاجم كلتيهما لإتمام الهجوم. هذا النمط شائع في التطبيقات المعقدة وكثيراً ما يُفوَّت في مراجعات الأمان التي تختبر نقاط النهاية بمعزل عن بعضها.',
    },
    impact: {
      en: 'Access to TOP SECRET M&A documents. In real corporate environments this constitutes industrial espionage, exposes merger strategies to competitors, and can result in securities law violations if traded upon.',
      ar: 'الوصول إلى وثائق الاستحواذ السرية للغاية. في بيئات الشركات الحقيقية يُشكّل هذا تجسساً صناعياً ويكشف استراتيجيات الاندماج للمنافسين ويمكن أن يؤدي إلى انتهاكات قانون الأوراق المالية إذا تُعُومِل على أساسها.',
    },
    fix: [
      'Consistent authorization: every endpoint that touches a resource must verify ownership',
      'Error responses: strip all metadata, IDs, and counts from 403/404 responses',
      'Defense in depth: even if ID is discovered, download must still enforce ownership',
      'Chained vulnerability testing: test attack flows that combine multiple endpoints',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'List your own documents: GET /documents/mine. Now try GET /documents/all — you get 403. But read the FULL response body, not just the status code. Does it say anything else?',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'The /documents/all endpoint returns 403 but its response body includes a "recentIds" array with document IDs including ones not in your /mine list.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        "Try downloading a document you don't own: GET /documents/download/DOC-CONF-2026-Q2. The download endpoint has no ownership check — it only checks if the document exists.",
    },
  ],

  flagAnswer: 'FLAG{MULTISTEP_IDOR_DOCUMENT_LEAK_M&A_2026}',
  initialState: {
    contents: [
      {
        title: 'DOC-1001',
        body: 'Employee Handbook 2026 — Public internal document',
        author: 'current_user',
        fileUrl: '/files/employee_handbook.pdf',
        isPublic: false,
      },
      {
        title: 'DOC-1002',
        body: 'Q1 Team Meeting Notes — Department-level access',
        author: 'current_user',
        fileUrl: '/files/q1_meeting_notes.pdf',
        isPublic: false,
      },
      {
        title: 'DOC-CONF-2026-Q2',
        body: JSON.stringify({
          fileName: 'Acquisition_Plan_Q2_2026_CONFIDENTIAL.pdf',
          classification: 'TOP SECRET - Executive Board Only',
          summary: 'M&A Strategy: FLAG{MULTISTEP_IDOR_DOCUMENT_LEAK_M&A_2026}',
          author: 'CFO Office',
          uploadDate: '2026-02-15',
        }),
        author: 'cfo_office',
        fileUrl: '/files/acquisition_plan_q2_confidential.pdf',
        isPublic: false,
      },
    ],
    logs: [
      {
        action: 'DOCUMENT_ACCESS_ATTEMPT',
        meta: {
          userId: 'current_user',
          attemptedDocId: 'DOC-CONF-2026-Q2',
          result: 'DENIED',
          timestamp: '2026-03-04T10:15:00Z',
        },
      },
    ],
  },
};
