// src/modules/practice-labs/wireshark/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  slug: 'wireshark-lab3-arp-trick',
  title: 'ARP Trick',
  ar_title: 'خدعة ARP',
  description: 'Analyze ARP packets and discover network manipulation techniques using Wireshark.',
  ar_description: 'قم بتحليل حزم ARP واكتشف تقنيات التلاعب بالشبكة باستخدام Wireshark.',
  difficulty: 'BEGINNER',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'ARP Protocol', 'Network Forensics', 'MITM Detection'],
  xpReward: 80,
  pointsReward: 80,
  duration: 20,
  isPublished: true,
  goal: 'Identify the ARP Spoofing attacker by analyzing Gratuitous ARP packets in the capture.',
  ar_goal: 'حدد المهاجم الذي ينفذ ARP Spoofing بتحليل حزم Gratuitous ARP في التقاط الشبكة.',
  flagAnswer: 'FLAG{WIRESHARK-LAB3-ARP-SPOOF}',
  briefing: {
    en: 'The network admin noticed unusual behavior on the corporate LAN. A packet capture was taken. Someone is impersonating the gateway — find who.',
    ar: 'لاحظ مسؤول الشبكة سلوكاً غير عادي على شبكة LAN. تم التقاط حزم الشبكة. شخص ما ينتحل شخصية البوابة — اكتشف من هو.',
  },
  stepsOverview: {
    en: [
      'Observe all ARP packets in the capture',
      'Filter protocol to ARP only',
      'Find the Gratuitous ARP — same IP claimed by two different MACs',
      'Identify the attacker\'s MAC address and submit the flag',
    ],
    ar: [
      'راقب جميع حزم ARP في الالتقاط',
      'قم بتصفية البروتوكول إلى ARP فقط',
      'ابحث عن Gratuitous ARP — نفس عنوان IP يدّعيه جهازان بـ MAC مختلفين',
      'حدد عنوان MAC للمهاجم وأرسل الفلاج',
    ],
  },
  solution: {
    context: 'ARP Spoofing works by sending Gratuitous ARP replies associating the attacker MAC with the gateway IP.',
    vulnerableCode: 'ARP Reply: 192.168.1.1 is at de:ad:be:ef:13:37 [Gratuitous — duplicate IP!]',
    exploitation: 'Filter ARP → find duplicate IP entries → compare MACs → attacker MAC is the one that differs from the real gateway.',
    steps: {
      en: [
        'Filter by ARP protocol',
        'Look for packets with opcode = gratuitous',
        'Compare senderMac for the same senderIp (192.168.1.1)',
        'The MAC that differs from the original reply is the attacker — submit in flag format',
      ],
      ar: [
        'صفّي بـ ARP',
        'ابحث عن الحزم ذات opcode = gratuitous',
        'قارن senderMac لنفس senderIp (192.168.1.1)',
        'الـ MAC المختلف عن الرد الأصلي هو المهاجم — أرسله بصيغة الفلاج',
      ],
    },
    fix: [
      'Enable Dynamic ARP Inspection (DAI) on managed switches.',
      'Use static ARP entries for critical infrastructure (gateway, DNS).',
      'Monitor for Gratuitous ARP broadcasts — flag unusual frequency.',
      'Deploy network monitoring tools: XArp, arpwatch.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'ARP Spoofing (Poisoning) is a Man-in-the-Middle technique. The attacker sends Gratuitous ARP replies to poison the ARP cache of all hosts, redirecting traffic through their machine.',
      ar: 'ARP Spoofing تقنية هجوم Man-in-the-Middle. يرسل المهاجم ردود ARP مزورة لتسميم ذاكرة التخزين المؤقت ARP لجميع المضيفين.',
    },
    impact: {
      en: 'Attacker intercepts all LAN traffic — credentials, session tokens, private data — even from HTTPS (via SSL stripping).',
      ar: 'يعترض المهاجم جميع حركة مرور LAN — بيانات الاعتماد، رموز الجلسة، البيانات الخاصة — حتى من HTTPS عبر SSL stripping.',
    },
    fix: [
      'Dynamic ARP Inspection (DAI) on all access switches.',
      '802.1X port authentication.',
      'Network segmentation with VLANs.',
      'VPN for sensitive internal traffic.',
    ],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Filter by ARP protocol. How many ARP replies claim to be 192.168.1.1?', xpCost: 5 },
    { order: 2, content: 'A Gratuitous ARP has the same sender and target IP. Look for opcode = gratuitous in the arpData.', xpCost: 10 },
    { order: 3, content: 'The attacker MAC appears in the Gratuitous ARP packets claiming to be the gateway. Expand arpData.senderMac.', xpCost: 20 },
  ],
};
