import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'bash-lab2-log-analysis',
  title: 'Bash Log Analysis',
  ar_title: 'تحليل السجلات بـ Bash',
  description: 'Use grep, awk, and cut to extract the hidden flag from server logs.',
  ar_description: 'استخدم grep و awk و cut لاستخراج الفلاج المخفي من سجلات الخادم.',
  difficulty: 'BEGINNER',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'grep', 'awk', 'Log Analysis', 'Text Processing'],
  xpReward: 60,
  pointsReward: 60,
  duration: 20,
  isPublished: true,
  goal: 'Use grep, awk, and cut to extract the hidden flag from server logs.',
  ar_goal: 'استخدم grep و awk و cut لاستخراج الفلاج المخفي من سجلات الخادم.',
  flagAnswer: 'FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
  briefing: {
    en: 'A security incident happened. The flag was accidentally logged in the server logs.',
    ar: 'حدث حادث أمني. تم تسجيل الفلاج عن طريق الخطأ في سجلات الخادم.',
  },
  stepsOverview: {
    en: [
      'List files: ls /var/log/',
      'Search with grep: grep "FLAG" /var/log/server.log',
      'Filter and extract using awk or cut',
    ],
    ar: [
      'اعرض الملفات: ls /var/log/',
      'ابحث بـ grep: grep "FLAG" /var/log/server.log',
      'صفّي واستخرج باستخدام awk أو cut',
    ],
  },
  solution: {
    context: 'Flag is in /var/log/server.log. Use grep to find it.',
    vulnerableCode: 'N/A — Log analysis challenge',
    exploitation: 'grep "FLAG" /var/log/server.log | awk -F"flag=" "{print $2}"',
    steps: {
      en: [
        'grep "FLAG" on the log content',
        'Find: ... flag=FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
        'Submit FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
      ],
      ar: [
        'grep "FLAG" على محتوى السجل',
        'ابحث عن: ... flag=FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
        'أرسل FLAG{BASH_LOG_ANALYSIS_GREP_AWK}',
      ],
    },
    fix: ['N/A — Bash skills challenge'],
  },
  postSolve: {
    explanation: {
      en: 'grep, awk, and sed are essential tools for log analysis in security operations (SOC/Blue Team).',
      ar: 'grep و awk و sed أدوات أساسية لتحليل السجلات في عمليات الأمن (SOC/الفريق الأزرق).',
    },
    impact: {
      en: 'Sensitive data accidentally logged is a common real-world vulnerability.',
      ar: 'البيانات الحساسة المسجَّلة عن طريق الخطأ هي ثغرة شائعة في العالم الحقيقي.',
    },
    fix: ['Implement log sanitization.', 'Never log sensitive data.', 'Use structured logging with field filtering.'],
  },
  initialState: {},
  hints: [
    { order: 1, content: 'Log file is at /var/log/server.log. Use cat or less to view it.', xpCost: 5 },
    { order: 2, content: 'Use grep "FLAG" /var/log/server.log to filter relevant lines.', xpCost: 10 },
    { order: 3, content: 'Use awk -F"flag=" "{print $2}" to extract the flag value.', xpCost: 15 },
  ],
};
