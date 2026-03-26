import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab6Metadata: LabMetadata = {
  slug: 'wireshark-sqli-hunt',
  title: 'Wireshark: SQLi Hunt via HTTP Traffic',
  ar_title: 'Wireshark: صيد حقن SQL عبر حركة HTTP',
  description:
    'A WAF flagged anomalous HTTP traffic. Investigate the capture, build the correct Wireshark display filter to isolate SQL injection attempts, identify the attacker IP and injected payload, then submit the flag.',
  ar_description:
    'أبلغ جدار حماية WAF عن حركة HTTP شاذة. افحص التقاط الحزم، أنشئ فلتر Wireshark الصحيح لعزل محاولات حقن SQL، حدّد IP المهاجم والـ payload المُحقونة، ثم أرسل الـ flag.',
  difficulty: 'INTERMEDIATE',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: ['Wireshark', 'SQL Injection', 'HTTP Analysis', 'Display Filters', 'Attack Detection'],
  xpReward: 150,
  pointsReward: 300,
  duration: 25,
  isPublished: true,
  goal: 'Isolate SQL injection HTTP requests using Wireshark display filters, identify the attacker IP and injected payload.',
  ar_goal: 'عزل طلبات HTTP المتضمنة لحقن SQL باستخدام فلاتر Wireshark، وتحديد IP المهاجم والـ payload المُحقونة.',
  briefing: {
    en: 'Your WAF generated an alert for anomalous HTTP traffic targeting the login endpoint. A packet capture was collected from the edge router. Analyse it, filter out the noise, and identify the exact SQL injection payload used by the attacker.',
    ar: 'أصدر جدار الحماية WAF تنبيهاً لحركة HTTP شاذة تستهدف نقطة النهاية /login. تم جمع التقاط الحزم من الراوتر الحدودي. حلّل الحزم، صفّ الضجيج، وحدد payload حقن SQL التي استخدمها المهاجم.',
  },
  stepsOverview: {
    en: [
      'Load the packet capture and observe all traffic',
      'Apply HTTP protocol filter to isolate web traffic',
      'Use display filter: http.request.uri contains "UNION" or http.request.uri contains "SELECT"',
      'Identify the attacker source IP from malicious packets',
      'Extract the injected SQL payload from the URI',
      'Submit the flag with the format FLAG{ATTACKER_IP:PAYLOAD}',
    ],
    ar: [
      'حمّل التقاط الحزم ولاحظ كل الحركة',
      'طبّق فلتر بروتوكول HTTP لعزل حركة الويب',
      'استخدم فلتر العرض: http.request.uri contains "UNION" أو http.request.uri contains "SELECT"',
      'حدّد IP المصدر للمهاجم من الحزم الخبيثة',
      'استخرج payload حقن SQL من الـ URI',
      'أرسل الـ flag بالصيغة FLAG{ATTACKER_IP:PAYLOAD}',
    ],
  },
  solution: {
    context:
      'The attacker used sqlmap to automate error-based and UNION-based SQL injection against the login endpoint. The attack is visible in HTTP GET requests with injected payloads in query parameters.',
    vulnerableCode:
      "GET /login?id=1' UNION SELECT 1,2,database()-- HTTP/1.1\nHost: target.local\nUser-Agent: sqlmap/1.7",
    exploitation:
      "Filter HTTP traffic → find GET requests with UNION/SELECT in URI → read query parameter → attacker IP is in the Source column.",
    steps: {
      en: [
        "Apply display filter: http.request.method == \"GET\"",
        'Add filter: http.request.uri contains "UNION"',
        'Note the Source IP of flagged packets',
        'Read the injected payload from the URI field in httpData',
      ],
      ar: [
        'طبّق فلتر العرض: http.request.method == "GET"',
        'أضف فلتر: http.request.uri contains "UNION"',
        'لاحظ IP المصدر للحزم المُبلَّغ عنها',
        'اقرأ الـ payload المُحقونة من حقل URI في httpData',
      ],
    },
    fix: [
      'Use parameterised queries / prepared statements.',
      'Deploy a WAF with SQLi rules (OWASP ModSecurity CRS).',
      'Never construct SQL queries with unsanitised user input.',
      'Enable IDS/IPS signatures for sqlmap user-agent patterns.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'SQL injection via HTTP GET parameters is trivially detectable in packet captures. Defenders can use Wireshark display filters or SIEM rules to identify these attacks in real time.',
      ar: 'حقن SQL عبر معاملات HTTP GET قابل للاكتشاف بسهولة في التقاطات الحزم. يمكن للمدافعين استخدام فلاتر Wireshark أو قواعد SIEM لاكتشاف هذه الهجمات في الوقت الفعلي.',
    },
    impact: {
      en: 'A successful SQLi attack can lead to full database exfiltration, authentication bypass, and remote code execution depending on the database permissions.',
      ar: 'يمكن أن يؤدي هجوم حقن SQL الناجح إلى تسريب قاعدة البيانات بالكامل، وتجاوز المصادقة، وتنفيذ التعليمات البرمجية عن بُعد حسب صلاحيات قاعدة البيانات.',
    },
    fix: [
      'Parameterised queries are the only reliable defence.',
      'Input validation as a secondary layer.',
      'Least-privilege DB accounts to limit blast radius.',
    ],
  },
  hints: [
    {
      order: 1,
      content: 'Filter HTTP traffic first: click HTTP in the protocol filter bar to hide TCP/ARP noise.',
      ar_content: 'صفّ حركة HTTP أولاً: انقر على HTTP في شريط فلتر البروتوكول لإخفاء ضجيج TCP/ARP.',
      xpCost: 10,
    },
    {
      order: 2,
      content: 'Use display filter: http.request.uri contains "UNION" to isolate the SQL injection attack packets.',
      ar_content: 'استخدم فلتر العرض: http.request.uri contains "UNION" لعزل حزم هجوم حقن SQL.',
      xpCost: 20,
    },
    {
      order: 3,
      content: 'The attacker is using sqlmap. Look for the User-Agent header — it reveals the tool used. The attacker IP is in the Source column of the flagged packets.',
      ar_content: 'المهاجم يستخدم sqlmap. ابحث عن ترويسة User-Agent — تكشف الأداة المستخدمة. IP المهاجم موجود في عمود المصدر للحزم المُبلَّغ عنها.',
      xpCost: 30,
    },
  ],
  flagAnswer: 'FLAG{SQLI_ATTACKER_DETECTED}',
  initialState: {},
};
