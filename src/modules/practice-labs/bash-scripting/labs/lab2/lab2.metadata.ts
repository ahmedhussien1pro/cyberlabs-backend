import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'bash-scripting-lab2-log-analysis',
  title: 'Log Analysis with grep & awk',
  ar_title: 'تحليل الـ Logs بـ grep و awk',
  description: 'Analyze a server log file using grep and awk to find the hidden flag.',
  ar_description: 'حلّل ملف Log باستخدام grep و awk للعثور على الفلاج المخفي.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'grep', 'awk', 'Log Analysis', 'Linux'],
  xpReward: 60,
  pointsReward: 60,
  duration: 15,
  isPublished: true,
  imageUrl: null,
  goal: 'Search through server logs using grep/awk to find the line containing the flag.',
  ar_goal: 'ابحث في سجلات الخادم باستخدام grep/awk لإيجاد السطر الذي يحتوي على الفلاج.',
  flagAnswer: 'FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
  briefing: {
    story: 'A security incident happened. The flag was accidentally logged in the server logs.',
    objective: 'Use grep or awk to find the line containing the flag in the log file.',
  },
  stepsOverview: [
    { step: 1, title: 'Get log file', description: 'Fetch the log content from /challenge' },
    { step: 2, title: 'Search', description: 'grep "FLAG" or awk "/FLAG/{print}"' },
    { step: 3, title: 'Submit', description: 'Extract and submit the FLAG{...} value' },
  ],
  solution: {
    summary: 'grep "FLAG" log.txt → finds the line with the flag.',
    steps: ['grep "FLAG" on the log content', 'Find: ... flag=FLAG{BASH_LOG_ANALYSIS_GREP_AWK}', 'Submit FLAG{BASH_LOG_ANALYSIS_GREP_AWK}'],
  },
  postSolve: {
    lesson: 'grep, awk, and sed are essential tools for log analysis in security operations (SOC/Blue Team).',
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Use grep "FLAG" to search for lines containing the flag pattern.', xpCost: 5 },
    { order: 2, content: 'The flag is in a log line with level=ERROR and action=secret_access.', xpCost: 10 },
  ],
};
