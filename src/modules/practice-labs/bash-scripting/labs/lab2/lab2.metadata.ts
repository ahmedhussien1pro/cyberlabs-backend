import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab2Metadata: LabMetadata = {
  slug: 'bash-lab2-log-analysis',
  title: 'Bash Log Analysis',
  ar_title: 'تحليل السجلات بـ Bash',
  description:
    'Use Linux text processing tools to extract a hidden flag from server access logs.',
  ar_description:
    'استخدم أدوات معالجة النص في Linux لاستخراج فلاج مخفي من سجلات وصول الخادم.',
  difficulty: 'BEGINNER',
  category: 'FUNDAMENTALS',
  executionMode: 'SHARED_BACKEND',
  skills: ['Bash', 'grep', 'awk', 'cut', 'Log Analysis', 'Text Processing'],
  xpReward: 60,
  pointsReward: 60,
  duration: 3600,
  isPublished: true,
  goal: 'Use Linux text processing tools to find and extract the hidden flag from the server log file.',
  ar_goal:
    'استخدم أدوات معالجة النص في Linux للعثور على الفلاج المخفي واستخراجه من ملف سجل الخادم.',
  flagAnswer: 'DYNAMIC',
  briefing: {
    en: 'A security incident occurred on the production server. During investigation, analysts discovered that sensitive data — including a flag — was accidentally written into the server access logs. Your mission: analyze the logs, locate the flag, and extract it.',
    ar: 'وقع حادث أمني على خادم الإنتاج. خلال التحقيق، اكتشف المحللون أن بيانات حساسة — من بينها فلاج — كُتبت عن طريق الخطأ في سجلات الوصول. مهمتك: حلّل السجلات، حدّد الفلاج، واستخرجه.',
  },
  stepsOverview: {
    en: [
      'You have access to a simulated Linux terminal — start by listing what log files are available',
      'View the contents of the log file to understand its structure',
      'The flag is hidden inside one specific log entry — not all lines are relevant',
      'Use text filtering tools to isolate the line that contains the flag',
      'Extract the flag value from that line and submit it',
    ],
    ar: [
      'لديك وصول إلى طرفية Linux محاكاة — ابدأ بعرض ملفات السجل المتاحة',
      'اعرض محتوى ملف السجل لفهم هيكله',
      'الفلاج مخفي داخل إدخال سجل محدد — ليست كل الأسطر ذات صلة',
      'استخدم أدوات تصفية النص لعزل السطر الذي يحتوي على الفلاج',
      'استخرج قيمة الفلاج من ذلك السطر وأرسلها',
    ],
  },
  solution: {
    context:
      "The log file contains multiple entries. One ERROR-level entry from the admin user contains a 'flag=' field with the dynamic flag value.",
    vulnerableCode: 'N/A — Log analysis challenge',
    exploitation:
      "grep 'flag=' /var/log/access.log | awk -F'flag=' '{print $2}'",
    steps: {
      en: [
        'Run: ls /var/log/ to list available log files',
        'Run: cat /var/log/access.log to view all entries',
        "Identify the ERROR line with 'flag=' field — it belongs to user=admin",
        'Use grep to filter lines containing the flag keyword',
        "Use awk with -F'flag=' to split on that delimiter and print the second field",
        'The extracted value is the dynamic flag — submit it',
      ],
      ar: [
        'نفِّذ: ls /var/log/ لعرض ملفات السجل المتاحة',
        'نفِّذ: cat /var/log/access.log لعرض كل الإدخالات',
        "حدد سطر ERROR الذي يحتوي على حقل 'flag=' — ينتمي إلى user=admin",
        'استخدم grep لتصفية السطور التي تحتوي على كلمة الفلاج',
        "استخدم awk مع -F'flag=' للتقسيم على هذا المحدد وطباعة الحقل الثاني",
        'القيمة المستخرجة هي الفلاج الديناميك — أرسله',
      ],
    },
    fix: [
      'Implement log sanitization to strip sensitive fields before writing.',
      'Never log credentials, tokens, or flag-like values.',
      'Use structured logging (JSON) with explicit field allowlists.',
      'Apply log rotation and access controls on log files.',
    ],
  },
  postSolve: {
    explanation: {
      en: "grep, awk, sed, and cut are essential tools in every security analyst's toolkit. Log analysis is a core skill in SOC operations, incident response, and digital forensics.",
      ar: 'grep و awk و sed و cut أدوات أساسية في مجموعة كل محلل أمني. تحليل السجلات مهارة جوهرية في عمليات SOC والاستجابة للحوادث والجنائيات الرقمية.',
    },
    impact: {
      en: 'Sensitive data accidentally logged is a CWE-532 vulnerability. In real incidents, attackers often find credentials, tokens, and API keys inside verbose log files.',
      ar: 'البيانات الحساسة المسجَّلة عن طريق الخطأ هي ثغرة CWE-532. في الحوادث الحقيقية، يجد المهاجمون في الغالب بيانات اعتماد ورموزاً ومفاتيح API داخل ملفات السجل المطوَّلة.',
    },
    fix: [
      'Implement log sanitization and field filtering.',
      'Never log sensitive data — use log levels appropriately.',
      'Use structured logging with field-level access controls.',
      'Regularly audit log outputs in CI/CD pipelines.',
    ],
  },
  initialState: {},
  hints: [
    {
      order: 1,
      content:
        'Start by exploring what files exist. Try: ls /var/log/ — then view the file content. Not every line is suspicious.',
      xpCost: 5,
    },
    {
      order: 2,
      content:
        'The flag is inside a specific field in one log line. Think about filtering lines by severity level or by a keyword that flags typically start with.',
      xpCost: 10,
    },
    {
      order: 3,
      content:
        'Once you find the right line, you need to extract just the flag value. A tool that splits text on a custom delimiter and prints a specific field will help.',
      xpCost: 15,
    },
  ],
};
