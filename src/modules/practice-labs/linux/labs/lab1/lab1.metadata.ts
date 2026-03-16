import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'linux-lab1-hidden-files',
  title: 'Hidden Files & Directories',
  ar_title: 'الملفات والمجلدات المخفية',
  description: 'Navigate the Linux filesystem and find the hidden flag file.',
  ar_description: 'تنقّل في نظام ملفات Linux وابحث عن ملف الفلاج المخفي.',
  difficulty: 'BEGINNER',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Linux', 'File System Navigation', 'Hidden Files', 'find command'],
  xpReward: 50,
  pointsReward: 50,
  duration: 15,
  isPublished: true,
  goal: 'Navigate the filesystem and find the hidden flag file.',
  ar_goal: 'تنقّل في نظام الملفات وابحث عن ملف الفلاج المخفي.',
  flagAnswer: 'FLAG{LINUX_HIDDEN_FILES_FOUND}',
  briefing: {
    en: 'You have shell access to a server. A flag file is hidden somewhere in the filesystem.',
    ar: 'لديك وصول shell إلى خادم. ملف الفلاج مخفي في مكان ما في نظام الملفات.',
  },
  stepsOverview: {
    en: [
      'Use ls -la to list hidden files (starting with .)',
      'Use find to search recursively for .flag files',
      'Read the file with cat',
    ],
    ar: [
      'استخدم ls -la لعرض الملفات المخفية (تبدأ بـ .)',
      'استخدم find للبحث بشكل متكرر عن ملفات .flag',
      'اقرأ الملف بـ cat',
    ],
  },
  solution: {
    context: 'Flag is in a hidden directory. Use ls -la and find to locate it.',
    vulnerableCode: 'N/A — Linux navigation challenge',
    exploitation: 'find / -name "*.flag" 2>/dev/null → cat the file.',
    steps: {
      en: [
        'ls -la /home → see hidden dirs',
        'find / -name "*.flag" 2>/dev/null → path revealed',
        'cat /path/to/.flag → FLAG{...}',
      ],
      ar: [
        'ls -la /home → رؤية المجلدات المخفية',
        'find / -name "*.flag" 2>/dev/null → الكشف عن المسار',
        'cat /path/to/.flag → FLAG{...}',
      ],
    },
    fix: ['N/A — Linux skills challenge'],
  },
  postSolve: {
    explanation: {
      en: 'Hidden files start with ".". Use ls -la or find to discover them. SUID files (+s) run with owner privileges.',
      ar: 'الملفات المخفية تبدأ بـ ".". استخدم ls -la أو find لاكتشافها. ملفات SUID (+s) تعمل بامتيازات المالك.',
    },
    impact: {
      en: 'Hidden files often contain sensitive configuration, credentials, or flags in CTF challenges.',
      ar: 'غالباً ما تحتوي الملفات المخفية على تكوين حساس أو بيانات اعتماد أو فلاجات في تحديات CTF.',
    },
    fix: ['Restrict filesystem permissions.', 'Audit hidden files regularly.', 'Use proper user isolation.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Files starting with "." are hidden. Try: ls -la', xpCost: 5 },
    { order: 2, content: 'Use find: find / -name "*.flag" 2>/dev/null', xpCost: 10 },
    { order: 3, content: 'Check /home and /root directories specifically.', xpCost: 15 },
  ],
};
