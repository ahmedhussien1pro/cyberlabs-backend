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

  goal: 'Access the confidential medical record of patient "Dr. Sarah Chen" (patientId: HC-VIP-2026) to retrieve the flag hidden in her diagnosis notes.',
  scenario: {
    context:
      'You are logged into a hospital patient portal as "John Doe" (patientId: HC-1001). The portal allows you to view your own medical records via: GET /api/records?patientId=HC-1001. The backend trusts the patientId parameter without verifying if it belongs to the authenticated user. A VIP patient (hospital director) has sensitive information in her record.',
    vulnerableCode: `// Backend fetches record by patientId from URL:
const { patientId } = req.query;
const record = await db.findRecord({ patientId });
// ❌ No authorization check: does patientId belong to current user?
res.json(record);`,
    exploitation:
      'Change the patientId parameter from your own ID to HC-VIP-2026 (Dr. Sarah Chen). The backend will return her record without checking if you have permission to view it. This is the classic IDOR pattern: trusting client-supplied object IDs.',
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
        'Try sequential IDs: HC-1002, HC-1003. You might see "Record not found" for some, but valid records for others. This confirms IDOR.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'The target is Dr. Sarah Chen, a VIP patient. Hospital VIP IDs often follow a different pattern: HC-VIP-XXXX. Try HC-VIP-2026.',
    },
    {
      order: 4,
      xpCost: 55,
      content:
        'Request: GET /records?patientId=HC-VIP-2026. Look inside the diagnosis field — the flag is embedded there as a confidential note.',
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
