import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'wireshark-lab1-http-credentials',
  title: 'Packet Analysis — HTTP Credentials',
  ar_title: 'تحليل الحزم — بيانات اعتماد HTTP',
  description: 'Network traffic was captured on CorpNet-04. Analyze the capture and recover what was transmitted.',
  ar_description: 'تم التقاط حركة شبكة على CorpNet-04. حلّل التقاط الحزم واسترجع ما تم إرساله.',
  difficulty: 'BEGINNER',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'Packet Analysis', 'HTTP', 'Network Forensics'],
  xpReward: 80,
  pointsReward: 80,
  duration: 25,
  isPublished: true,
  goal: 'Recover credentials exposed in unencrypted network traffic.',
  ar_goal: 'استرجاع بيانات اعتماد مكشوفة في حركة شبكة غير مشفرة.',
  briefing: {
    en: 'During a routine audit on CorpNet-04, a packet capture was taken on VLAN 10. A workstation at 192.168.1.12 made an outbound connection to the internal portal. Analyze the traffic.',
    ar: 'خلال تدقيق روتيني على CorpNet-04، تم التقاط حركة شبكة على VLAN 10. قامت محطة عمل على 192.168.1.12 باتصال بالبوابة الداخلية. حلّل حركة المرور.',
  },
  // stepsOverview — admin/seed only, not shown to student during lab
  stepsOverview: {
    en: [
      'Filter by protocol = HTTP',
      'Find POST /portal/auth/login packet',
      'Expand httpData.body → password field is the flag',
    ],
    ar: [
      'صفّي بـ protocol=HTTP',
      'ابحث عن حزمة POST /portal/auth/login',
      'وسّع httpData.body → حقل password هو الـ flag',
    ],
  },
  solution: {
    context: 'HTTP POST /portal/auth/login sends credentials in plaintext. Filter by HTTP and look for the POST request.',
    vulnerableCode: 'POST /portal/auth/login HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\nusername=j.henderson&password=<FLAG>',
    exploitation: 'Filter HTTP → find POST /portal/auth/login → read body → extract password value.',
    steps: {
      en: ['Filter by protocol=HTTP', 'Find POST /portal/auth/login packet', 'Expand httpData.body → password field is the flag'],
      ar: ['صفّي بـ protocol=HTTP', 'ابحث عن حزمة POST /portal/auth/login', 'وسّع httpData.body → حقل password هو الـ flag'],
    },
    fix: [
      'Enforce HTTPS (TLS 1.3) for all traffic.',
      'Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      'Never deploy auth endpoints over plain HTTP.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'HTTP transmits all data in plaintext. A passive sniffer on the same network segment captures every credential sent over port 80.',
      ar: 'HTTP ينقل جميع البيانات كنص واضح. أي sniffer سلبي على نفس قطاع الشبكة يلتقط كل بيانات الاعتماد المرسلة.',
    },
    impact: {
      en: 'An attacker performing ARP spoofing or physically connected to the same switch segment can silently capture all cleartext credentials.',
      ar: 'مهاجم ينفّذ ARP Spoofing أو متصل فعلياً بنفس قطاع المحوّل يمكنه التقاط كل بيانات الاعتماد بصمت.',
    },
    fix: ['Enforce HTTPS everywhere.', 'Use HSTS headers.', 'Enable certificate pinning for mobile clients.'],
  },
  hints: [
    { order: 1, content: 'Not all protocols send data in plaintext — focus on which one does.', xpCost: 5 },
    { order: 2, content: 'Web login forms submit data using a specific HTTP method.', xpCost: 10 },
    { order: 3, content: 'Expand the packet details — credentials are in the request body.', xpCost: 20 },
  ],
  // flagAnswer is a placeholder — actual flag is dynamic per session (generated at runtime)
  flagAnswer: 'FLAG{WIRESHARK-LAB1-HTTP-CREDS-DYNAMIC}',
  initialState: {},
};
