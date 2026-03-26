// src/modules/practice-labs/wireshark/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab4Metadata: LabMetadata = {
  slug: 'wireshark-lab4-tcp-intrusion',
  title: 'TCP Intrusion',
  ar_title: 'اختراق TCP',
  description: 'Investigate TCP traffic patterns and identify intrusion attempts in network communications.',
  ar_description: 'تحقق من أنماط حركة مرور TCP وحدد محاولات الاختراق في اتصالات الشبكة.',
  difficulty: 'INTERMEDIATE',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'TCP Analysis', 'Port Scanning Detection', 'Intrusion Detection', 'SSH Security'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  goal: 'Analyze the captured TCP traffic, identify the port scanning phase, and determine the attacker IP address.',
  ar_goal: 'حلل حركة مرور TCP الملتقطة، حدد مرحلة فحص المنافذ، واكتشف عنوان IP للمهاجم.',
  flagAnswer: 'FLAG{WIRESHARK-LAB4-TCP-INTRUSION}',
  briefing: {
    en: 'The security team detected unusual traffic on the internal server (10.0.0.5). A full packet capture was collected. Analyze it to identify the attacker and the attack phases.',
    ar: 'اكتشف فريق الأمان حركة مرور غير معتادة على الخادم الداخلي (10.0.0.5). تم جمع التقاط كامل للحزم. حللها لتحديد المهاجم ومراحل الهجوم.',
  },
  stepsOverview: {
    en: [
      'Observe all traffic in the capture',
      'Filter by TCP to isolate TCP connections',
      'Identify the SYN scan pattern — one IP sending rapid SYN to many ports',
      'Spot the SSH brute force phase following the scan',
      'Submit the attacker IP as the flag',
    ],
    ar: [
      'راقب جميع حركة المرور في الالتقاط',
      'صفّي بـ TCP لعزل اتصالات TCP',
      'حدد نمط SYN Scan — IP واحد يرسل SYN سريعاً لمنافذ متعددة',
      'الاحظ مرحلة SSH Brute Force التي تتبع الفحص',
      'أرسل عنوان IP المهاجم كفلاج',
    ],
  },
  solution: {
    context: 'A classic two-phase intrusion: SYN port scan (Nmap style) followed by SSH brute force on discovered open port 22.',
    vulnerableCode: 'TCP SYN packets to ports 22, 23, 80, 443, 8080 in rapid succession from 10.0.0.99',
    exploitation: 'Filter TCP → sort by source → find IP with multiple rapid SYN packets to different ports → that is the scanner.',
    steps: {
      en: [
        'Filter by TCP protocol',
        'Look for packets with flags = SYN only (no ACK)',
        'Find the IP that sent SYN to ports: 22, 23, 80, 443, 8080 all within 2ms',
        'Confirm by checking the SSH brute force attempts after the scan',
        'Submit: FLAG{attacker-ip}',
      ],
      ar: [
        'صفّي بـ TCP',
        'ابحث عن حزم بـ flags = SYN فقط (بدون ACK)',
        'ابحث عن IP أرسل SYN للمنافذ: 22، 23، 80، 443، 8080 في 2ms',
        'تحقق بمراجعة محاولات SSH Brute Force بعد الفحص',
        'أرسل: FLAG{attacker-ip}',
      ],
    },
    fix: [
      'Rate-limit SYN packets per IP on the firewall (SYN cookies).',
      'Block IPs exceeding SYN threshold with fail2ban or iptables.',
      'Disable SSH password authentication — use key-based auth only.',
      'Move SSH to non-standard port or use port knocking.',
      'Deploy IDS: Snort / Suricata with port-scan detection rules.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'A SYN scan (half-open scan) sends SYN packets without completing the TCP handshake. It is stealthy because no full connection is established. Followed by brute force on open ports.',
      ar: 'يرسل SYN Scan حزم SYN دون إكمال مصافحة TCP. إنه خفي لأنه لا يُنشئ اتصالاً كاملاً. يليه brute force على المنافذ المفتوحة.',
    },
    impact: {
      en: 'Allows attacker to map all open services silently, then launch targeted attacks on each discovered service.',
      ar: 'يتيح للمهاجم رسم خريطة لجميع الخدمات المفتوحة بصمت، ثم شن هجمات موجهة على كل خدمة مكتشفة.',
    },
    fix: [
      'Implement SYN flood protection at the network edge.',
      'Use a Web Application Firewall (WAF) for HTTP services.',
      'Enable SSH key authentication and disable passwords.',
      'Monitor with SIEM: alert on >10 SYN/s from single IP.',
    ],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Filter by TCP. Focus on packets with only the SYN flag set — no ACK.', xpCost: 5 },
    { order: 2, content: 'One IP is sending SYN packets to many different ports in rapid succession. That is a port scanner.', xpCost: 10 },
    { order: 3, content: 'Look at packets 5–14 — all SYN from the same source IP to different destination ports. Check sshData on packets 15+ for the brute force phase.', xpCost: 20 },
  ],
};
