import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'wireshark-lab1-http-credentials',
  title: 'HTTP Credential Sniffing',
  ar_title: 'التقاط بيانات الدخول عبر HTTP',
  description: 'Analyze a simulated packet capture to find login credentials transmitted in plaintext HTTP.',
  ar_description: 'حلّل تقاط حزم محاكى لإيجاد بيانات الدخول المرسلة بنص واضح عبر HTTP.',
  difficulty: 'BEGINNER',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'Network Analysis', 'HTTP', 'Packet Capture', 'Credentials'],
  xpReward: 60,
  pointsReward: 60,
  duration: 15,
  isPublished: true,
  imageUrl: null,
  goal: 'Find the password submitted in an HTTP POST request in the packet capture.',
  ar_goal: 'أوجد الباسورد المرسل في HTTP POST request في التقاط الحزم.',
  flagAnswer: 'FLAG{WIRESHARK_HTTP_CREDS_EXPOSED}',
  briefing: {
    story: 'You captured network traffic on a corporate network. You suspect credentials are being sent in plaintext.',
    objective: 'Find the HTTP POST request and extract the password from the form data.',
  },
  stepsOverview: [
    { step: 1, title: 'Load capture', description: 'Fetch the simulated packet capture from /challenge' },
    { step: 2, title: 'Find HTTP POST', description: 'Look for packets with protocol=HTTP and method=POST' },
    { step: 3, title: 'Extract password', description: 'Read the body of the POST request' },
  ],
  solution: {
    summary: 'Packet #3 is HTTP POST /login. Body contains password=FLAG{WIRESHARK_HTTP_CREDS_EXPOSED}.',
    steps: ['Filter by protocol=HTTP', 'Find POST /login packet', 'Read httpData.body → extract password value'],
  },
  postSolve: {
    lesson: 'HTTP transmits data in plaintext. Use HTTPS (TLS) for all authenticated traffic. Use Wireshark filter: http.request.method == POST',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Look for packets with protocol="HTTP" and info containing "POST".', xpCost: 5 },
    { order: 2, content: 'The POST request body contains: username=admin&password=FLAG{...}', xpCost: 10 },
  ],
};
