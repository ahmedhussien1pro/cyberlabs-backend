// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab4Metadata: LabMetadata = {
  slug: 'acvuln-multistep-idor-documents',
  title: 'Multi-Step IDOR: Corporate Document Leak',
  ar_title: 'IDOR متعدد الخطوات: تسريب وثائق الشركة',
  description:
    'Exploit a multi-step IDOR vulnerability in a corporate document management system. First enumerate document IDs, then exploit a separate download endpoint that lacks authorization checks.',
  ar_description:
    'استغل ثغرة IDOR متعددة الخطوات في نظام إدارة وثائق الشركة. أولاً، اعدد معرفات الوثائق، ثم استغل نقطة تحميل منفصلة تفتقر إلى فحوصات التفويض.',
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

  goal: 'Access the confidential M&A document titled "Acquisition_Plan_Q2_2026_CONFIDENTIAL.pdf" by exploiting two separate IDOR vulnerabilities: one in document listing and one in document download.',
  scenario: {
    context:
      'You work at MegaCorp and have access to a document portal. You can list your own documents via GET /api/documents/mine and download them via GET /api/documents/download/:docId. The listing endpoint only shows YOUR documents, but the download endpoint trusts the docId parameter without checking ownership. Additionally, an admin endpoint /api/documents/all exists but returns 403 — however, its response leaks document IDs in the error logs.',
    vulnerableCode: `// Listing endpoint (safe):
GET /documents/mine → filters by userId ✅

// Download endpoint (vulnerable):
GET /documents/download/:docId
const doc = await db.documents.findById(docId);
// ❌ No ownership check
res.download(doc.filePath);`,
    exploitation:
      "Step 1: Enumerate document IDs. Try accessing /documents/all (403 but leaks IDs in response metadata). Step 2: Use the discovered docId in /documents/download/:docId to download files you don't own. The download endpoint performs no authorization check.",
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'List your own documents: GET /documents/mine. You see IDs like DOC-1001, DOC-1002. Now try GET /documents/all — you get 403, but check the response body carefully. Does it leak any metadata?',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'The /documents/all endpoint returns 403 but includes a "totalDocuments" count and "recentIds" array in the error response. Use these IDs.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'Try downloading: GET /documents/download/DOC-CONF-2026-Q2. This is the confidential M&A document ID leaked in the metadata.',
    },
    {
      order: 4,
      xpCost: 85,
      content:
        'Full exploit: GET /documents/download/DOC-CONF-2026-Q2. The response will include the document content with the flag embedded in the executive summary.',
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
