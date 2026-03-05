// src/modules/practice-labs/idor/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab5Metadata: LabMetadata = {
  slug: 'idor-batch-api-mass-exfiltration',
  title: 'IDOR: Batch API — CEO Report Mass Exfiltration',
  ar_title: 'IDOR: واجهة API الدفعية — سحب جماعي لتقارير الرئيس التنفيذي',
  description:
    "Exploit IDOR in a batch API endpoint that accepts arrays of report IDs without ownership validation. Enumerate report IDs in bulk to exfiltrate all users' analytics reports, including confidential CEO business intelligence data.",
  ar_description:
    'استغل ثغرة IDOR في endpoint دفعي يقبل مصفوفات من معرفات التقارير دون التحقق من الملكية. عدّد معرفات التقارير بشكل جماعي لسحب تقارير جميع المستخدمين بما فيها بيانات الذكاء التجاري السرية للرئيس التنفيذي.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'IDOR',
    'Batch API Abuse',
    'Mass Data Exfiltration',
    'Insecure Bulk Operations',
    'Business Intelligence Security',
  ],
  xpReward: 420,
  pointsReward: 210,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: "Use the batch reports endpoint to enumerate and exfiltrate report IDs RPT-5001 through RPT-5020. Find the CEO's confidential Q4 intelligence report (marked EXECUTIVE ONLY) and retrieve the embedded flag.",
  scenario: {
    context:
      'DataPulse is a B2B analytics SaaS platform. The /reports/batch endpoint accepts an array of up to 20 reportIds and returns their data in bulk. This endpoint was built for dashboard performance optimization. However, it performs zero ownership validation — any authenticated user can request any combination of reportIds from any organization.',
    vulnerableCode: `// Batch reports endpoint (vulnerable):
app.post('/reports/batch', authenticate, async (req, res) => {
  const { reportIds } = req.body; // Array of IDs
  // ❌ No ownership check per reportId!
  const reports = await db.reports.findMany({ id: { in: reportIds } });
  res.json({ reports });
});`,
    exploitation:
      'POST /reports/batch with reportIds: ["RPT-5001", "RPT-5002", ..., "RPT-5020"]. Receive all 20 reports in one response. One of them is the CEO\'s EXECUTIVE ONLY report containing the flag.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Your report is RPT-5001. The /reports/batch endpoint accepts multiple IDs at once. Try sending an array: ["RPT-5001", "RPT-5002"].',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Batch endpoints process all IDs at once. Can you send 20 IDs in one request? Try RPT-5001 through RPT-5020.',
    },
    {
      order: 3,
      xpCost: 65,
      content:
        'POST /reports/batch with { "reportIds": ["RPT-5001", ..., "RPT-5015"] }. Look for a report with classification "EXECUTIVE_ONLY".',
    },
    {
      order: 4,
      xpCost: 95,
      content:
        'The CEO report is at RPT-5012. Include it in your batch request. The flag is in the "executiveSummary" field of the response.',
    },
  ],
  flagAnswer: 'FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
  initialState: {
    contents: [
      {
        title: 'RPT-5001',
        body: JSON.stringify({
          title: 'Q4 Marketing Performance',
          classification: 'INTERNAL',
          owner: 'marketing_team',
          revenue: 245000,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5002',
        body: JSON.stringify({
          title: 'User Acquisition Funnel',
          classification: 'INTERNAL',
          owner: 'growth_team',
          newUsers: 12400,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5003',
        body: JSON.stringify({
          title: 'Infrastructure Cost Analysis',
          classification: 'CONFIDENTIAL',
          owner: 'devops_team',
          monthlyCost: 89000,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5004',
        body: JSON.stringify({
          title: 'Sales Pipeline Q4',
          classification: 'CONFIDENTIAL',
          owner: 'sales_team',
          pipeline: 1200000,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5005',
        body: JSON.stringify({
          title: 'Customer Churn Analysis',
          classification: 'INTERNAL',
          owner: 'success_team',
          churnRate: '4.2%',
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5006',
        body: JSON.stringify({
          title: 'Product Roadmap Metrics',
          classification: 'CONFIDENTIAL',
          owner: 'product_team',
          completedFeatures: 34,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5007',
        body: JSON.stringify({
          title: 'Security Audit Results',
          classification: 'RESTRICTED',
          owner: 'security_team',
          criticalFindings: 2,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5008',
        body: JSON.stringify({
          title: 'HR Headcount Analysis',
          classification: 'CONFIDENTIAL',
          owner: 'hr_team',
          totalHeadcount: 234,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5009',
        body: JSON.stringify({
          title: 'Competitor Intelligence Brief',
          classification: 'RESTRICTED',
          owner: 'strategy_team',
          topCompetitors: ['CompA', 'CompB'],
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5010',
        body: JSON.stringify({
          title: 'Partnership Revenue Share',
          classification: 'CONFIDENTIAL',
          owner: 'partnerships_team',
          partnerRevenue: 450000,
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5011',
        body: JSON.stringify({
          title: 'Board Meeting Deck Data',
          classification: 'RESTRICTED',
          owner: 'exec_team',
          preparedBy: 'CFO',
        }),
        author: 'report',
        isPublic: false,
      },
      {
        title: 'RPT-5012',
        body: JSON.stringify({
          title: 'CEO Q4 Executive Intelligence Report',
          classification: 'EXECUTIVE_ONLY',
          owner: 'ceo_office',
          executiveSummary: {
            annualRevenue: 8750000,
            acquisitionTarget: 'CompetitorX — $25M acquisition in progress',
            layoffPlan: 'Q1 2027 — 8% workforce reduction',
            secretProduct:
              'Project PHOENIX — AI-powered zero-day detection platform',
            flag: 'FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
          },
          accessLevel: 'CEO + Board Only',
        }),
        author: 'ceo_report',
        isPublic: false,
      },
    ],
  },
};
