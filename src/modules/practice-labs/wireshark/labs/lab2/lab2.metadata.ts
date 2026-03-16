import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'wireshark-lab2-tcp-stream',
  title: 'TCP Stream Reassembly',
  ar_title: 'إعادة تجميع تدفق TCP',
  description: 'Decode Base64 TCP segments and reassemble the full message to get the flag.',
  ar_description: 'فك ترميز مقاطع TCP بـ Base64 وأعِد تجميع الرسالة الكاملة للحصول على الفلاج.',
  difficulty: 'INTERMEDIATE',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'TCP Stream Analysis', 'Base64 Decoding', 'Network Forensics'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  goal: 'Decode Base64 TCP segments and reassemble the full message to get the flag.',
  ar_goal: 'فك ترميز مقاطع TCP بـ Base64 وأعِد تجميعها للحصول على الفلاج.',
  flagAnswer: 'FLAG{TCP_STREAM_REASSEMBLED}',
  briefing: {
    en: 'A suspicious TCP session was captured. The data is fragmented across multiple segments.',
    ar: 'تم التقاط جلسة TCP مريبة. البيانات مجزأة عبر مقاطع متعددة.',
  },
  stepsOverview: {
    en: [
      'Load the TCP stream segments',
      'Click Decode Base64 on each segment',
      'Concatenate decoded segments in order by seq number',
      'The concatenated text contains the flag',
    ],
    ar: [
      'حمّل مقاطع تدفق TCP',
      'انقر على فك ترميز Base64 على كل مقطع',
      'اربط المقاطع المفكوكة ترميزها بالترتيب حسب رقم seq',
      'النص المتسلسل يحتوي على الفلاج',
    ],
  },
  solution: {
    context: 'TCP stream split into Base64 segments. Decode each and concatenate in seq order.',
    vulnerableCode: 'N/A — Network forensics challenge',
    exploitation: 'Decode each segment with atob() → concatenate by seq order → read flag.',
    steps: {
      en: [
        'Decode segment #1: atob(payload1)',
        'Decode segment #2: atob(payload2)',
        'Concatenate all in order → FLAG{TCP_STREAM_REASSEMBLED}',
      ],
      ar: [
        'فك ترميز المقطع #1: atob(payload1)',
        'فك ترميز المقطع #2: atob(payload2)',
        'ربط الكل بالترتيب → FLAG{TCP_STREAM_REASSEMBLED}',
      ],
    },
    fix: ['N/A — Network forensics challenge'],
  },
  postSolve: {
    explanation: {
      en: 'Wireshark\'s "Follow TCP Stream" feature does this automatically. Use it in real investigations.',
      ar: 'ميزة "Follow TCP Stream" في Wireshark تفعل هذا تلقائياً. استخدمها في التحقيقات الحقيقية.',
    },
    impact: {
      en: 'Unencrypted TCP streams can be fully reassembled and read by network-level attackers.',
      ar: 'تدفقات TCP غير المشفرة يمكن إعادة تجميعها وقراءتها بالكامل من قِبَل المهاجمين على مستوى الشبكة.',
    },
    fix: ['Use TLS for all TCP communications.', 'Implement certificate pinning.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Each segment payload is Base64 encoded. Decode them individually.', xpCost: 5 },
    { order: 2, content: 'Order matters. Sort by seq number before concatenating.', xpCost: 10 },
    { order: 3, content: 'Concatenate all decoded segments in order → the result is your flag.', xpCost: 20 },
  ],
};
