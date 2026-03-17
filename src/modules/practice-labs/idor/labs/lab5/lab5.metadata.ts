// src/modules/practice-labs/idor/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab5Metadata: LabMetadata = {
  slug: 'idor-batch-api-mass-exfiltration',
  canonicalConceptId: 'idor-batch-api-abuse',
  environmentType: 'GENERIC',
  title: 'IDOR: Batch API — CEO Report Mass Exfiltration',
  ar_title: 'IDOR: واجهة API الدفعية — سحب جماعي لتقارير الرئيس التنفيذي',
  description:
    "Exploit IDOR in a batch API endpoint that accepts arrays of report IDs without ownership validation. Enumerate report IDs in bulk to exfiltrate all users' analytics reports, including confidential CEO business intelligence data.",
  ar_description:
    'استغل ثغرة IDOR في endpoint دفعي يقبل مصفوفات من معرفات التقارير دون التحقق من الملكية. عدّد معرفات التقارير بشكل جماعي لسحب تقارير جميع المستخدمين بما فيها بيانات الذكاء التجاري السرية للرئيس التنفيذي.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'Batch API Abuse', 'Mass Data Exfiltration', 'Insecure Bulk Operations', 'Business Intelligence Security'],
  xpReward: 420,
  pointsReward: 210,
  duration: 65,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  missionBrief: {
    codename: 'OPERATION DATA FLOOD',
    classification: 'TOP_SECRET',
    objective: 'Abuse DataPulse batch reports endpoint to exfiltrate the CEO classified Q4 intelligence report containing acquisition plans, layoff details, and the flag.',
    ar_objective: 'استغل endpoint التقارير الدفعي في DataPulse لسحب تقرير الذكاء التنفيذي Q4 السري الذي يحتوي على خطط الاستحواذ وتفاصيل التسريح والعلم.',
    successCriteria: ['Extract the flag from the executiveSummary.flag field of the CEO EXECUTIVE_ONLY report.'],
    ar_successCriteria: ['استخرج العلم من حقل executiveSummary.flag في تقرير الرئيس التنفيذي EXECUTIVE_ONLY.'],
  },
  labInfo: {
    vulnType: 'IDOR — Batch API Mass Exfiltration',
    cweId: 'CWE-639',
    cvssScore: 9.3,
    description: 'Batch API endpoints amplify IDOR impact: a single request can exfiltrate N records simultaneously without per-item ownership checks.',
    ar_description: 'نقاط نهاية API الدفعية تضخّم تأثير IDOR: طلب واحد يمكنه سحب N سجل في وقت واحد دون فحوصات ملكية لكل عنصر.',
    whatYouLearn: [
      'How batch API endpoints amplify IDOR impact (N records per request)',
      'Why bulk operations require per-item ownership checks, not just authentication',
      'Mass data exfiltration pattern in GraphQL and REST bulk endpoints',
      'Mitigation: filter-before-query pattern + org-scoped IDs',
    ],
    ar_whatYouLearn: [
      'كيف تضخّم نقاط نهاية API الدفعية تأثير IDOR (N سجل في كل طلب)',
      'لماذا تحتاج العمليات الجماعية فحوصات ملكية لكل عنصر، وليس فقط مصادقة',
      'نمط سحب البيانات الجماعي في GraphQL وREST bulk endpoints',
      'التخفيف: نمط filter-before-query + معرفات مقيدة بالمؤسسة',
    ],
    techStack: ['REST API', 'Node.js', 'Batch Endpoint', 'Analytics SaaS'],
    references: [
      { label: 'OWASP API Security — BOLA', url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/' },
      { label: 'PortSwigger IDOR Guide', url: 'https://portswigger.net/web-security/access-control/idor' },
      { label: 'CWE-639', url: 'https://cwe.mitre.org/data/definitions/639.html' },
    ],
  },
  goal: "Use the batch reports endpoint to enumerate and exfiltrate report IDs RPT-5001 through RPT-5020. Find the CEO's confidential Q4 intelligence report (marked EXECUTIVE_ONLY) and retrieve the embedded flag.",
  ar_goal: 'استخدم endpoint التقارير الدفعي لتعداد وسحب معرفات التقارير RPT-5001 إلى RPT-5020. ابحث عن تقرير الذكاء التنفيذي Q4 السري (مُصنَّف EXECUTIVE_ONLY) واسترجع العلم المضمَّن.',
  briefing: {
    en: `DataPulse — B2B analytics SaaS. Real-time dashboards. Business intelligence. For enterprises. You are a standard analyst. You have access to your organization's reports. Your report: RPT-5001. Q4 Marketing Performance. INTERNAL classification. The platform has a batch endpoint: POST /reports/batch. It accepts up to 20 reportIds at once. You send: { "reportIds": ["RPT-5001", "RPT-5002"] }. RPT-5002 comes back. Different team. Different org. No error. No 403. Just data. The batch endpoint doesn't check ownership. You have 20 slots. RPT-5001 through RPT-5020. One request. Everything.`,
    ar: `DataPulse — SaaS تحليلات B2B. لوحات تحكم فورية. ذكاء أعمال. للمؤسسات. أنت محلل قياسي. لديك وصول لتقارير مؤسستك. تقريرك: RPT-5001. أداء تسويق Q4. تصنيف INTERNAL. للمنصة endpoint دفعي: POST /reports/batch. يقبل حتى 20 reportId في آنِ واحد. ترسل: { "reportIds": ["RPT-5001"، "RPT-5002"] }. يعود RPT-5002. فريق مختلف. منظمة مختلفة. لا خطأ. لا 403. فقط بيانات. الـ endpoint الدفعي لا يتحقق من الملكية. لديك 20 فتحة. RPT-5001 إلى RPT-5020. طلب واحد. كل شيء.`,
  },
  stepsOverview: {
    en: [
      'POST /reports/batch { "reportIds": ["RPT-5001", "RPT-5002"] } — confirm cross-org IDOR',
      'Understand batch amplification: 1 request = 20 records exfiltrated simultaneously',
      'Send full batch: RPT-5001 through RPT-5020 in a single request',
      'Scan responses for classification: "EXECUTIVE_ONLY"',
      'Extract the flag from the executiveSummary.flag field',
    ],
    ar: [
      'POST /reports/batch { "reportIds": ["RPT-5001"، "RPT-5002"] } — أكّد IDOR عبر المؤسسات',
      'افهم تضخيم الدفعي: طلب 1 = 20 سجل مُسرَّب في وقت واحد',
      'أرسل الدفعة الكاملة: RPT-5001 إلى RPT-5020 في طلب واحد',
      'افحص الاستجابات للتصنيف: "EXECUTIVE_ONLY"',
      'استخرج العلم من حقل executiveSummary.flag',
    ],
  },
  solution: {
    context:
      "DataPulse /reports/batch endpoint accepts an array of reportIds and returns all matching reports without any per-report ownership check. RPT-5012 is the CEO's EXECUTIVE_ONLY Q4 intelligence report containing the flag.",
    vulnerableCode:
      '// Batch reports endpoint (vulnerable):\n' +
      "app.post('/reports/batch', authenticate, async (req, res) => {\n" +
      '  const { reportIds } = req.body;\n' +
      '  // ❌ No ownership check per reportId!\n' +
      '  const reports = await db.reports.findMany({ id: { in: reportIds } });\n' +
      '  res.json({ reports });\n' +
      '});',
    exploitation:
      'POST /reports/batch { "reportIds": ["RPT-5001",...,"RPT-5012"] } → scan for classification: "EXECUTIVE_ONLY" → RPT-5012 contains flag in executiveSummary.flag',
    steps: {
      en: [
        'POST /reports/batch { "reportIds": ["RPT-5001", "RPT-5002"] } → both returned → IDOR confirmed',
        'Build full array: ["RPT-5001", ..., "RPT-5012"]',
        'POST /reports/batch with full array → 12 reports returned',
        'Find RPT-5012: classification: "EXECUTIVE_ONLY" → executiveSummary.flag: FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
      ],
      ar: [
        'POST /reports/batch { "reportIds": ["RPT-5001"، "RPT-5002"] } → كلاهما مُعاد → تم تأكيد IDOR',
        'بنِ المصفوفة الكاملة: ["RPT-5001"، ...، "RPT-5012"]',
        'POST /reports/batch بالمصفوفة الكاملة → 12 تقريراً مُعادة',
        'ابحث عن RPT-5012: classification: "EXECUTIVE_ONLY" → executiveSummary.flag: FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
      ],
    },
    fix: [
      'Per-item ownership check in batch: filter reportIds to only those owned by req.user.orgId',
      'Correct pattern: const ownedIds = await db.reports.findOwnedIds(reportIds, req.user.orgId)',
      'Silent filtering: return only owned reports without error to prevent enumeration confirmation',
      'Monitor: alert on requests containing more than 5 sequential IDs',
    ],
  },
  postSolve: {
    explanation: {
      en: 'Batch API IDOR is a force-multiplied vulnerability. A single-record IDOR leaks one record per request. A batch IDOR leaks N records per request. This pattern is common in GraphQL APIs, REST bulk endpoints, and mobile app sync APIs.',
      ar: 'IDOR في الـ API الدفعي هو ثغرة مُضاعفة القوة. IDOR سجل واحد يُسرّب سجلاً واحداً في كل طلب. IDOR دفعي يُسرّب N سجلاً لكل طلب.',
    },
    impact: {
      en: 'Mass exfiltration of entire platform report database in seconds. Revenue figures, acquisition plans, layoff plans, competitive intelligence all extracted in one API call. Rated Critical (CVSS 9.0+) in real-world bug bounty programs.',
      ar: 'سحب جماعي لقاعدة بيانات التقارير الكاملة في ثوانِ. أرقام الإيرادات وخطط الاستحواذ وخطط التسريح والاستخبارات التنافسية كلها مستخرجة في استدعاء API واحد.',
    },
    fix: [
      'Filter-before-query: never query by arbitrary IDs — always intersect with ownership scope first',
      'GraphQL-specific: implement field-level resolvers with authorization per node',
      'Monitoring: alert on requests with more than 5 sequential IDs',
      'Organization scoping: reports queryable only within authenticated user org context',
    ],
  },
  hints: [
    { order: 1, xpCost: 20, ar_content: 'تقريرك هو RPT-5001. الـ endpoint /reports/batch يقبل معرفات متعددة في مصفوفة. جرّب: { "reportIds": ["RPT-5001"، "RPT-5002"] } — هل تحصل على RPT-5002 رغم أنه ينتمي لمؤسسة مختلفة؟', content: 'Your report is RPT-5001. The /reports/batch endpoint accepts multiple IDs in an array. Try: { "reportIds": ["RPT-5001", "RPT-5002"] } — do you get RPT-5002 even though it belongs to a different organization?' },
    { order: 2, xpCost: 40, ar_content: 'الـ endpoint الدفعي يقبل حتى 20 معرفاً. أرسل جميع RPT-5001 إلى RPT-5015 في طلب واحد. ابحث عن تقرير بتصنيف: "EXECUTIVE_ONLY".', content: 'The batch endpoint accepts up to 20 IDs. Send all of RPT-5001 through RPT-5015 in one request. Look for a report with classification: "EXECUTIVE_ONLY".' },
    { order: 3, xpCost: 65, ar_content: 'تقرير الرئيس التنفيذي موجود عند RPT-5012. أدرجه في دفعتك. العلم مدمج داخل كائن executiveSummary في استجابة ذلك التقرير.', content: "The CEO report is at RPT-5012. Include it in your batch. The flag is nested inside the executiveSummary object of that report's response." },
  ],
  flagAnswer: 'FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
  initialState: {
    contents: [
      { title: 'RPT-5001', body: JSON.stringify({ title: 'Q4 Marketing Performance', classification: 'INTERNAL', owner: 'marketing_team', revenue: 245000 }), author: 'report', isPublic: false },
      { title: 'RPT-5002', body: JSON.stringify({ title: 'User Acquisition Funnel', classification: 'INTERNAL', owner: 'growth_team', newUsers: 12400 }), author: 'report', isPublic: false },
      { title: 'RPT-5003', body: JSON.stringify({ title: 'Infrastructure Cost Analysis', classification: 'CONFIDENTIAL', owner: 'devops_team', monthlyCost: 89000 }), author: 'report', isPublic: false },
      { title: 'RPT-5004', body: JSON.stringify({ title: 'Sales Pipeline Q4', classification: 'CONFIDENTIAL', owner: 'sales_team', pipeline: 1200000 }), author: 'report', isPublic: false },
      { title: 'RPT-5005', body: JSON.stringify({ title: 'Customer Churn Analysis', classification: 'INTERNAL', owner: 'success_team', churnRate: '4.2%' }), author: 'report', isPublic: false },
      { title: 'RPT-5006', body: JSON.stringify({ title: 'Product Roadmap Metrics', classification: 'CONFIDENTIAL', owner: 'product_team', completedFeatures: 34 }), author: 'report', isPublic: false },
      { title: 'RPT-5007', body: JSON.stringify({ title: 'Security Audit Results', classification: 'RESTRICTED', owner: 'security_team', criticalFindings: 2 }), author: 'report', isPublic: false },
      { title: 'RPT-5008', body: JSON.stringify({ title: 'HR Headcount Analysis', classification: 'CONFIDENTIAL', owner: 'hr_team', totalHeadcount: 234 }), author: 'report', isPublic: false },
      { title: 'RPT-5009', body: JSON.stringify({ title: 'Competitor Intelligence Brief', classification: 'RESTRICTED', owner: 'strategy_team', topCompetitors: ['CompA', 'CompB'] }), author: 'report', isPublic: false },
      { title: 'RPT-5010', body: JSON.stringify({ title: 'Partnership Revenue Share', classification: 'CONFIDENTIAL', owner: 'partnerships_team', partnerRevenue: 450000 }), author: 'report', isPublic: false },
      { title: 'RPT-5011', body: JSON.stringify({ title: 'Board Meeting Deck Data', classification: 'RESTRICTED', owner: 'exec_team', preparedBy: 'CFO' }), author: 'report', isPublic: false },
      { title: 'RPT-5012', body: JSON.stringify({ title: 'CEO Q4 Executive Intelligence Report', classification: 'EXECUTIVE_ONLY', owner: 'ceo_office', executiveSummary: { annualRevenue: 8750000, acquisitionTarget: 'CompetitorX — $25M acquisition in progress', layoffPlan: 'Q1 2027 — 8% workforce reduction', secretProduct: 'Project PHOENIX — AI-powered zero-day detection platform', flag: 'FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}' }, accessLevel: 'CEO + Board Only' }), author: 'ceo_report', isPublic: false },
    ],
  },
};
