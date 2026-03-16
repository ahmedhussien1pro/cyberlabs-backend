import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab1Metadata: LabMetadata = {
  slug: 'linux-lab1-hidden-files',
  title: 'Linux Hidden File Discovery',
  ar_title: 'اكتشاف الملفات المخفية في Linux',
  description: 'Navigate a simulated Linux filesystem using terminal commands to find the hidden flag file.',
  ar_description: 'تصفح نظام ملفات Linux محاكى باستخدام أوامر Terminal لإيجاد الملف المخفي.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Linux', 'Terminal', 'File System Navigation', 'ls -la', 'find', 'cat'],
  xpReward: 60,
  pointsReward: 60,
  duration: 20,
  isPublished: true,
  imageUrl: null,
  goal: 'Use Linux terminal commands to navigate the filesystem and find the hidden flag.',
  ar_goal: 'استخدم أوامر Linux للتنقل في نظام الملفات وإيجاد الفلاج المخفي.',
  flagAnswer: 'FLAG{LINUX_HIDDEN_FILE_FOUND}',
  briefing: {
    story: 'You have shell access to a server. A flag file is hidden somewhere in the filesystem.',
    objective: 'Use ls, cat, find to locate and read the hidden flag.',
  },
  stepsOverview: [
    { step: 1, title: 'Explore', description: 'Use ls -la to list all files including hidden ones' },
    { step: 2, title: 'Search', description: 'Use find / -name "*flag*" to search broadly' },
    { step: 3, title: 'Read', description: 'cat the flag file to get its content' },
  ],
  solution: {
    summary: 'find / -name "find_flag" → cat /usr/bin/find_flag → FLAG{...}',
    steps: [
      'find / -name "*flag*" or find / -perm -u=s',
      'Locate /usr/bin/find_flag',
      'cat /usr/bin/find_flag → FLAG{LINUX_HIDDEN_FILE_FOUND}',
    ],
  },
  postSolve: {
    lesson: 'Hidden files start with ".". Use ls -la or find to discover them. SUID files (+s) run with owner privileges.',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'ls -la shows hidden files (starting with ".").', xpCost: 5 },
    { order: 2, content: 'Use find / -name "*flag*" to search the entire filesystem.', xpCost: 10 },
    { order: 3, content: 'The flag is in /usr/bin/find_flag. Use cat to read it.', xpCost: 15 },
  ],
};
