import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab7Metadata: LabMetadata = {
  slug: 'wireshark-c2-beacon',
  title: 'Wireshark: C2 Beacon Detection',
  ar_title: 'Wireshark: اكتشاف منارة C2',
  description:
    'An EDR alert flagged periodic outbound connections from an internal workstation. Investigate the capture, identify the beacon interval, find the C2 server IP, extract the beacon signature, then submit the flag.',
  ar_description:
    'أصدر نظام EDR تنبيهاً لاتصالات دورية خارجية من محطة عمل داخلية. افحص التقاط الحزم، حدّد فترة المنارة، ابحث عن IP خادم C2، استخرج توقيع المنارة، ثم أرسل الـ flag.',
  difficulty: 'ADVANCED',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'C2 Detection', 'Malware Traffic Analysis', 'TCP Analysis', 'Threat Hunting'],
  xpReward: 200,
  pointsReward: 400,
  duration: 35,
  isPublished: true,
  goal: 'Identify C2 beaconing traffic by detecting periodic TCP SYN patterns, calculate the beacon interval, and extract the C2 server IP.',
  ar_goal: 'تحديد حركة منارة C2 عن طريق اكتشاف أنماط TCP SYN الدورية، حساب فترة المنارة، واستخراج IP خادم C2.',
  briefing: {
    en: 'Your EDR flagged suspicious periodic outbound connections from workstation 10.0.0.55. A full packet capture was collected. Analyse the traffic to confirm C2 beaconing, identify the remote server, calculate the interval, and extract the signature used by the implant.',
    ar: 'أبلغ نظام EDR عن اتصالات خارجية دورية مشبوهة من محطة العمل 10.0.0.55. تم جمع التقاط كامل للحزم. حلّل الحركة لتأكيد منارة C2، تحديد الخادم البعيد، حساب الفترة الزمنية، واستخراج التوقيع الذي يستخدمه الـ implant.',
  },
  stepsOverview: {
    en: [
      'Load the capture and observe all traffic patterns',
      'Filter TCP SYN packets: tcp.flags.syn == 1 && tcp.flags.ack == 0',
      'Look for the same destination IP appearing at regular intervals',
      'Calculate the time difference between consecutive SYN packets to the same IP',
      'Inspect the TCP payload or custom header for the beacon signature',
      'Submit the flag: FLAG{C2_IP:INTERVAL_SECONDS:SIGNATURE}',
    ],
    ar: [
      'حمّل التقاط الحزم ولاحظ أنماط الحركة',
      'صفّ حزم TCP SYN: tcp.flags.syn == 1 && tcp.flags.ack == 0',
      'ابحث عن نفس IP الوجهة يظهر على فترات منتظمة',
      'احسب الفرق الزمني بين حزم SYN المتتالية لنفس الـ IP',
      'افحص حمولة TCP أو الترويسة المخصصة لتوقيع المنارة',
      'أرسل الـ flag: FLAG{C2_IP:INTERVAL_SECONDS:SIGNATURE}',
    ],
  },
  solution: {
    context:
      'The malware implant beacons every 60 seconds to a hard-coded C2 server on port 4444. Each beacon contains a custom X-Beacon-ID header identifying the implant session.',
    vulnerableCode:
      'TCP SYN every 60s → 185.220.101.47:4444\nCustom header: X-Beacon-ID: IMPLANT_SESSION_ABC123',
    exploitation:
      'Filter tcp.flags.syn==1 && tcp.flags.ack==0 → group by destination → find periodic pattern → read timestamps → calculate delta → expand TCP payload for signature.',
    steps: {
      en: [
        'Apply filter: tcp.flags.syn == 1 && tcp.flags.ack == 0',
        'Sort by Destination column — find IP with multiple hits',
        'Check timestamps of packets to that IP: delta = 60s',
        'Expand packet → TCP payload → find X-Beacon-ID value',
      ],
      ar: [
        'طبّق الفلتر: tcp.flags.syn == 1 && tcp.flags.ack == 0',
        'رتّب حسب عمود الوجهة — ابحث عن IP به ضربات متعددة',
        'تحقق من طوابع وقت الحزم لذلك IP: الفارق = 60 ثانية',
        'وسّع الحزمة → حمولة TCP → ابحث عن قيمة X-Beacon-ID',
      ],
    },
    fix: [
      'Deploy NDR (Network Detection & Response) with ML-based beaconing detection.',
      'Block outbound traffic to unknown IPs on uncommon ports (4444, 8080, etc).',
      'Use DNS sinkholes to block C2 domains.',
      'Threat hunt using JA3 TLS fingerprints for known implant signatures.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'C2 beaconing is a hallmark of modern malware. The regular interval is a statistical anomaly detectable by network monitoring tools and SIEM correlation rules.',
      ar: 'تُعدّ منارة C2 سمة مميزة للبرمجيات الخبيثة الحديثة. الفترة المنتظمة هي شذوذ إحصائي قابل للاكتشاف بأدوات مراقبة الشبكة وقواعد ارتباط SIEM.',
    },
    impact: {
      en: 'An active C2 channel allows the attacker to exfiltrate data, deploy additional payloads, pivot laterally, and maintain persistent access to the compromised host.',
      ar: 'تتيح قناة C2 النشطة للمهاجم تسريب البيانات، ونشر حمولات إضافية، والتحرك جانبياً، والحفاظ على وصول دائم إلى المضيف المخترق.',
    },
    fix: [
      'Implement network segmentation to limit lateral movement.',
      'Monitor for outbound connections to uncommon ports.',
      'Use endpoint EDR with memory scanning for implant detection.',
    ],
  },
  hints: [
    {
      order: 1,
      content: 'Filter TCP traffic and look for the same destination IP appearing at regular time intervals — that is the beacon.',
      ar_content: 'صفّ حركة TCP وابحث عن نفس IP الوجهة يظهر على فترات زمنية منتظمة — هذه هي المنارة.',
      xpCost: 10,
    },
    {
      order: 2,
      content: 'Use display filter: tcp.flags.syn == 1 && tcp.flags.ack == 0 to isolate only outbound connection initiations.',
      ar_content: 'استخدم فلتر العرض: tcp.flags.syn == 1 && tcp.flags.ack == 0 لعزل بدايات الاتصالات الخارجية فقط.',
      xpCost: 20,
    },
    {
      order: 3,
      content: 'The beacon interval is exactly 60 seconds. Check the time delta between consecutive SYN packets to the suspicious destination IP.',
      ar_content: 'فترة المنارة هي 60 ثانية بالضبط. تحقق من الفرق الزمني بين حزم SYN المتتالية لـ IP الوجهة المشبوهة.',
      xpCost: 30,
    },
  ],
  flagAnswer: 'FLAG{C2_BEACON_IDENTIFIED}',
  initialState: {},
};
