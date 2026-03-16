import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'wireshark-lab1-http-credentials',
  title: 'Packet Analysis — HTTP Credentials',
  ar_title: 'تحليل الحزم — بيانات اعتماد HTTP',
  description: 'Inspect the pcap capture and extract the plaintext credentials sent over HTTP.',
  ar_description: 'افحص التقاط pcap واستخرج بيانات الاعتماد بالنص الصريح المرسلة عبر HTTP.',
  difficulty: 'BEGINNER',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'Packet Analysis', 'HTTP', 'Network Forensics'],
  xpReward: 80,
  pointsReward: 80,
  duration: 25,
  isPublished: true,
  goal: 'Inspect the pcap capture and extract the plaintext credentials sent over HTTP.',
  ar_goal: 'افحص التقاط pcap واستخرج بيانات الاعتماد المرسلة بشكل صريح عبر HTTP.',
  flagAnswer: 'FLAG{HTTP_CREDENTIALS_CAPTURED}',
  briefing: {
    en: 'You captured network traffic on a corporate network. You suspect credentials are being sent in plaintext.',
    ar: 'التقطت حركة شبكة على شبكة مؤسسية. تشتبه في إرسال بيانات الاعتماد بنص صريح.',
  },
  stepsOverview: {
    en: [
      'Load the packet capture in the viewer',
      'Filter by protocol=HTTP',
      'Find POST /login packet and expand its body',
      'Extract username and password → submit as FLAG{username:password}',
    ],
    ar: [
      'حمّل التقاط الحزمة في العارض',
      'صفّي بـ protocol=HTTP',
      'ابحث عن حزمة POST /login ووسّع جسمها',
      'استخرج اسم المستخدم وكلمة المرور → أرسل كـ FLAG{username:password}',
    ],
  },
  solution: {
    context: 'HTTP POST /login sends credentials in plaintext. Filter by HTTP and look for POST requests.',
    vulnerableCode: 'POST /login HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&password=secret123',
    exploitation: 'Filter HTTP packets → find POST /login → read body → username:password.',
    steps: {
      en: [
        'Filter by protocol=HTTP',
        'Find POST /login packet',
        'Read httpData.body → extract password value',
      ],
      ar: [
        'صفّي بـ protocol=HTTP',
        'ابحث عن حزمة POST /login',
        'اقرأ httpData.body → استخرج قيمة كلمة المرور',
      ],
    },
    fix: [
      'Use HTTPS (TLS 1.3) for all authenticated traffic.',
      'Never send credentials over plain HTTP.',
      'Wireshark filter: http.request.method == POST',
    ],
  },
  postSolve: {
    explanation: {
      en: 'HTTP transmits data in plaintext. Use HTTPS (TLS) for all authenticated traffic.',
      ar: 'HTTP ينقل البيانات بنص صريح. استخدم HTTPS (TLS) لجميع حركة المرور المصادَق عليها.',
    },
    impact: {
      en: 'Anyone on the same network can capture and read plaintext credentials using free tools like Wireshark.',
      ar: 'يمكن لأي شخص على نفس الشبكة التقاط وقراءة بيانات الاعتماد الصريحة باستخدام أدوات مجانية مثل Wireshark.',
    },
    fix: ['Enforce HTTPS everywhere.', 'Use HSTS headers.', 'Certificate pinning for mobile apps.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Look for HTTP packets (not HTTPS). Filter by protocol.', xpCost: 5 },
    { order: 2, content: 'Find a POST request. HTTP form data is sent in the body.', xpCost: 10 },
    { order: 3, content: 'Click on the HTTP POST /login packet and expand its body to see the credentials.', xpCost: 20 },
  ],
};
