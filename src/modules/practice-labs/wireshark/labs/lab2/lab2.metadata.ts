import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'wireshark-lab2-tcp-stream-reassembly',
  title: 'TCP Stream Reassembly',
  ar_title: 'إعادة تجميع TCP Stream',
  description: 'Reassemble fragmented TCP stream segments and decode each Base64 payload to find the flag.',
  ar_description: 'أعد تجميع أجزاء TCP Stream المجزأة وفك تشفير كل payload بـ Base64 لإيجاد الفلاج.',
  difficulty: 'BEGINNER',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'TCP', 'Stream Reassembly', 'Base64', 'Network Forensics'],
  xpReward: 75,
  pointsReward: 75,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Decode all Base64 TCP segments in order to reassemble the stream and find the flag.',
  ar_goal: 'فك تشفير جميع أجزاء TCP بـ Base64 بالترتيب لإعادة تجميع الـ stream وإيجاد الفلاج.',
  flagAnswer: 'FLAG{WIRESHARK_TCP_STREAM_REASSEMBLY}',
  briefing: {
    story: 'A suspicious TCP session was captured. The data is fragmented across multiple segments.',
    objective: 'Reassemble the TCP stream by decoding segments in sequence order.',
  },
  stepsOverview: [
    { step: 1, title: 'Load stream', description: 'Fetch the fragmented TCP segments from /challenge' },
    { step: 2, title: 'Sort by seq', description: 'Order segments by seq number' },
    { step: 3, title: 'Decode each', description: 'Base64-decode each payload in order' },
    { step: 4, title: 'Find flag', description: 'The flag is embedded in the reassembled content' },
  ],
  solution: {
    summary: 'Decode 3 Base64 segments → seg3 contains <b>FLAG{WIRESHARK_TCP_STREAM_REASSEMBLY}</b>.',
    steps: [
      'Sort by seq: 1, 2, 3',
      'atob(seg1) → "HTTP/1.1 200 OK"',
      'atob(seg2) → "Content-Type: text/html"',
      'atob(seg3) → "<b>FLAG{WIRESHARK_TCP_STREAM_REASSEMBLY}</b>"',
    ],
  },
  postSolve: {
    lesson: 'Wireshark\'s "Follow TCP Stream" feature does this automatically. Use it in real investigations.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Sort segments by their seq number before decoding.', xpCost: 5 },
    { order: 2, content: 'Each payload is Base64-encoded. Decode all 3 in order.', xpCost: 10 },
    { order: 3, content: 'The flag is in segment 3. Decode its Base64 payload.', xpCost: 15 },
  ],
};
