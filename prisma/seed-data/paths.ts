import { PrismaClient, Difficulty, CourseColor } from '@prisma/client';

export const learningPathsData = [
  {
    slug: 'it-os-fundamentals',
    title: 'IT & OS Fundamentals',
    ar_title: 'أساسيات تكنولوجيا المعلومات وأنظمة التشغيل',
    description:
      'Master the core concepts of operating systems and IT infrastructure necessary for cybersecurity.',
    ar_description:
      'أتقن المفاهيم الأساسية لأنظمة التشغيل والبنية التحتية اللازمة للأمن السيبراني.',
    longDescription:
      'This path covers the essential building blocks of IT, including lab setup, Windows architecture, and Linux fundamentals. Perfect for complete beginners starting their cybersecurity journey.',
    ar_longDescription:
      'يغطي هذا المسار اللبنات الأساسية لتكنولوجيا المعلومات، بما في ذلك إعداد المعامل، وهيكلية ويندوز، وأساسيات لينكس. مثالي للمبتدئين تماماً.',
    iconName: 'Laptop',
    color: 'BLUE' as CourseColor,
    difficulty: 'BEGINNER' as Difficulty,
    order: 1,
    isPublished: true,
    isFeatured: true,
    tags: ['IT', 'OS', 'Windows', 'Linux', 'Fundamentals'],
    ar_tags: [
      'تكنولوجيا المعلومات',
      'أنظمة التشغيل',
      'ويندوز',
      'لينكس',
      'أساسيات',
    ],
    courses: [
      {
        slug: 'building-your-security-lab',
        title: 'Building Your Security Lab',
      },
      { slug: 'windows-fundamentals', title: 'Windows Fundamentals' },
      { slug: 'linux-fundamentals-part-1', title: 'Linux Fundamentals Part 1' },
      { slug: 'linux-fundamentals-part-2', title: 'Linux Fundamentals Part 2' },
    ],
  },
  {
    slug: 'web-technologies-security',
    title: 'Web Technologies & Security',
    ar_title: 'تكنولوجيا وأمن الويب',
    description:
      'Understand how the web works and learn the foundational concepts of web security.',
    ar_description:
      'افهم كيف يعمل الويب وتعلم المفاهيم الأساسية لأمن تطبيقات الويب.',
    longDescription:
      'Dive into HTTP, web architectures, session management, and the core security mechanisms that protect modern web applications.',
    ar_longDescription:
      'تعمق في بروتوكول HTTP، وهيكلية الويب، وإدارة الجلسات، وآليات الأمان الأساسية التي تحمي تطبيقات الويب الحديثة.',
    iconName: 'Globe',
    color: 'CYAN' as CourseColor,
    difficulty: 'BEGINNER' as Difficulty,
    order: 2,
    isPublished: true,
    isFeatured: true,
    tags: ['Web', 'HTTP', 'Security Basics'],
    ar_tags: ['ويب', 'بروتوكولات', 'أساسيات الأمن'],
    courses: [
      { slug: 'how-the-web-works', title: 'How The Web Works' },
      {
        slug: 'web-application-architecture',
        title: 'Web Application Architecture',
      },
      { slug: 'cookies-sessions-lab', title: 'Cookies & Sessions Lab' },
      { slug: 'authentication-deep-dive', title: 'Authentication Deep Dive' },
      { slug: 'web-security-basics', title: 'Web Security Basics' },
    ],
  },
  {
    slug: 'scripting-applied-cryptography',
    title: 'Scripting & Applied Cryptography',
    ar_title: 'البرمجة والتشفير التطبيقي',
    description:
      'Learn automation, scripting, and the mathematics behind securing data.',
    ar_description: 'تعلم الأتمتة، والبرمجة، والرياضيات وراء تأمين البيانات.',
    longDescription:
      'Automate tasks using Bash and Python, master regular expressions, and understand both the foundations and vulnerabilities of cryptographic systems.',
    ar_longDescription:
      'قم بأتمتة المهام باستخدام Bash و Python، وأتقن التعبيرات النمطية، وافهم أساسيات وثغرات أنظمة التشفير.',
    iconName: 'Code',
    color: 'VIOLET' as CourseColor,
    difficulty: 'INTERMEDIATE' as Difficulty,
    order: 3,
    isPublished: true,
    isFeatured: false,
    tags: ['Scripting', 'Python', 'Bash', 'Cryptography'],
    ar_tags: ['برمجة', 'بايثون', 'باش', 'تشفير'],
    courses: [
      {
        slug: 'bash-scripting-for-security',
        title: 'Bash Scripting for Security',
      },
      {
        slug: 'python-for-security-basics',
        title: 'Python for Security Basics',
      },
      {
        slug: 'regular-expressions-for-security',
        title: 'Regular Expressions for Security',
      },
      { slug: 'cryptography-fundamentals', title: 'Cryptography Fundamentals' },
      { slug: 'cryptography-attacks', title: 'Cryptography Attacks' },
    ],
  },
  {
    slug: 'network-security-traffic-analysis',
    title: 'Network Security & Traffic Analysis',
    ar_title: 'أمن الشبكات وتحليل البيانات',
    description:
      'Master network protocols, discover vulnerabilities, and analyze network traffic.',
    ar_description:
      'أتقن بروتوكولات الشبكة، واكتشف الثغرات، وحلل حركة البيانات.',
    longDescription:
      'Learn to use essential tools like Nmap and Wireshark, understand wireless and VPN vulnerabilities, and learn how to defend network infrastructures.',
    ar_longDescription:
      'تعلم استخدام الأدوات الأساسية مثل Nmap و Wireshark، وافهم ثغرات الشبكات اللاسلكية والـ VPN، وكيفية الدفاع عن البنى التحتية للشبكات.',
    iconName: 'Network',
    color: 'EMERALD' as CourseColor,
    difficulty: 'INTERMEDIATE' as Difficulty,
    order: 4,
    isPublished: true,
    isFeatured: true,
    tags: ['Networking', 'Traffic Analysis', 'Wireshark', 'Nmap'],
    ar_tags: ['شبكات', 'تحليل بيانات', 'وايرشارك', 'إن ماب'],
    courses: [
      {
        slug: 'vpn-secure-communications',
        title: 'VPN & Secure Communications',
      },
      {
        slug: 'wireshark-packet-analysis-pro',
        title: 'Wireshark Packet Analysis Pro',
      },
      {
        slug: 'nmap-network-discovery-mastery',
        title: 'Nmap Network Discovery Mastery',
      },
      {
        slug: 'network-attacks-exploitation',
        title: 'Network Attacks & Exploitation',
      },
      { slug: 'wireless-security-attacks', title: 'Wireless Security Attacks' },
      {
        slug: 'network-defense-hardening',
        title: 'Network Defense & Hardening',
      },
    ],
  },
  {
    slug: 'web-application-penetration-testing',
    title: 'Web Application Penetration Testing',
    ar_title: 'اختبار اختراق تطبيقات الويب',
    description:
      'Learn to find and exploit critical vulnerabilities in web applications.',
    ar_description:
      'تعلم كيفية اكتشاف واستغلال الثغرات الحرجة في تطبيقات الويب.',
    longDescription:
      'Master Burp Suite and dive deep into OWASP Top 10 vulnerabilities including SQLi, XSS, CSRF, and API security flaws.',
    ar_longDescription:
      'أتقن استخدام Burp Suite وتعمق في ثغرات الـ OWASP العشرة الأولى بما في ذلك حقن قواعد البيانات، والـ XSS، والـ CSRF، وثغرات الـ APIs.',
    iconName: 'ShieldAlert',
    color: 'ROSE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 5,
    isPublished: true,
    isFeatured: true,
    tags: ['Web Hacking', 'Bug Bounty', 'OWASP', 'Burp Suite'],
    ar_tags: ['اختراق الويب', 'اكتشاف الثغرات', 'أواسب', 'بيرب سويت'],
    courses: [
      {
        slug: 'burp-suite-web-hacking-essentials',
        title: 'Burp Suite Web Hacking Essentials',
      },
      { slug: 'owasp-sql-injection-sqli', title: 'OWASP SQL Injection (SQLi)' },
      { slug: 'owasp-xss-csrf', title: 'OWASP XSS & CSRF' },
      {
        slug: 'owasp-authentication-authorization',
        title: 'OWASP Authentication & Authorization',
      },
      { slug: 'api-security-testing', title: 'API Security Testing' },
    ],
  },
  {
    slug: 'enterprise-infrastructure-security',
    title: 'Enterprise & Infrastructure Security',
    ar_title: 'أمن البنية التحتية والشركات',
    description:
      'Attack and defend enterprise environments focusing on Active Directory.',
    ar_description:
      'قم بالهجوم والدفاع عن بيئات الشركات مع التركيز على Active Directory.',
    longDescription:
      'Understand Active Directory architecture, perform enumeration and attacks, and secure Windows enterprise environments.',
    ar_longDescription:
      'افهم هيكلية الأكتيف دايركتوري، وقم بعمليات جمع المعلومات والهجمات، وقم بتأمين بيئات ويندوز للشركات.',
    iconName: 'Server',
    color: 'ORANGE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 6,
    isPublished: true,
    isFeatured: false,
    tags: ['Active Directory', 'Enterprise', 'Windows', 'Red Team'],
    ar_tags: ['أكتيف دايركتوري', 'شركات', 'ويندوز', 'الفريق الأحمر'],
    courses: [
      {
        slug: 'active-directory-fundamentals',
        title: 'Active Directory Fundamentals',
      },
      { slug: 'ad-attacks-enumeration', title: 'AD Attacks & Enumeration' },
      { slug: 'vpn-exploitation-security', title: 'VPN Exploitation Security' },
      { slug: 'windows-security', title: 'Windows Security' },
      { slug: 'windows-security-advanced', title: 'Windows Security Advanced' },
    ],
  },
  {
    slug: 'privilege-escalation-exploitation',
    title: 'Privilege Escalation & Exploitation',
    ar_title: 'الاستغلال وتصعيد الصلاحيات',
    description:
      'Take your access to the next level by escalating privileges on target systems.',
    ar_description:
      'ارتق بصلاحياتك للمستوى التالي من خلال تصعيد الصلاحيات على الأنظمة المستهدفة.',
    longDescription:
      'Master the Metasploit framework, learn password cracking techniques, and escalate privileges on both Windows and Linux systems.',
    ar_longDescription:
      'أتقن استخدام منصة Metasploit، وتعلم تقنيات كسر كلمات المرور، وقم بتصعيد صلاحياتك على أنظمة ويندوز ولينكس.',
    iconName: 'Key',
    color: 'ROSE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 7,
    isPublished: true,
    isFeatured: false,
    tags: ['PrivEsc', 'Exploitation', 'Metasploit', 'Password Cracking'],
    ar_tags: ['تصعيد صلاحيات', 'استغلال', 'ميتاسبلويت', 'كسر كلمات المرور'],
    courses: [
      {
        slug: 'metasploit-exploitation-basics',
        title: 'Metasploit Exploitation Basics',
      },
      {
        slug: 'password-cracking-techniques',
        title: 'Password Cracking Techniques',
      },
      {
        slug: 'windows-privilege-escalation',
        title: 'Windows Privilege Escalation',
      },
      {
        slug: 'linux-privilege-escalation',
        title: 'Linux Privilege Escalation',
      },
    ],
  },
  {
    slug: 'defensive-security-blue-teaming',
    title: 'Defensive Security & Blue Teaming',
    ar_title: 'الأمن الدفاعي والاستجابة للحوادث',
    description: 'Learn to detect, analyze, and respond to cyber threats.',
    ar_description:
      'تعلم كيفية اكتشاف، وتحليل، والاستجابة للتهديدات السيبرانية.',
    longDescription:
      'Master log analysis, SIEM solutions, introductory digital forensics, malware analysis, and incident response methodologies.',
    ar_longDescription:
      'أتقن تحليل السجلات، وحلول إدارة الأحداث الأمنية، والمقدمة في الأدلة الجنائية الرقمية، وتحليل البرمجيات الخبيثة، ومنهجيات الاستجابة للحوادث.',
    iconName: 'ShieldCheck',
    color: 'EMERALD' as CourseColor,
    difficulty: 'INTERMEDIATE' as Difficulty,
    order: 8,
    isPublished: true,
    isFeatured: true,
    tags: ['Blue Team', 'SIEM', 'Forensics', 'Incident Response', 'Malware'],
    ar_tags: [
      'الفريق الأزرق',
      'سجلات',
      'أدلة جنائية',
      'استجابة للحوادث',
      'برمجيات خبيثة',
    ],
    courses: [
      { slug: 'linux-security-hardening', title: 'Linux Security Hardening' },
      {
        slug: 'threat-intelligence-osint',
        title: 'Threat Intelligence & OSINT',
      },
      { slug: 'log-analysis-siem-basics', title: 'Log Analysis & SIEM Basics' },
      {
        slug: 'malware-analysis-introduction',
        title: 'Malware Analysis Introduction',
      },
      { slug: 'digital-forensics-basics', title: 'Digital Forensics Basics' },
      {
        slug: 'incident-response-methodology',
        title: 'Incident Response Methodology',
      },
    ],
  },
];

export async function seedLearningPaths(prisma: PrismaClient) {
  console.log('🛣️  Seeding learning paths...');

  for (const pathData of learningPathsData) {
    const { courses: pathCourses, ...pathFields } = pathData;

    // 1. Upsert LearningPath
    const learningPath = await prisma.learningPath.upsert({
      where: { slug: pathFields.slug },
      create: {
        ...pathFields,
        totalCourses: pathCourses.length,
        isPublished: true,
      },
      update: {
        ...pathFields,
        totalCourses: pathCourses.length,
        isPublished: true,
      },
    });

    // 2. Delete old PathModules (إعادة بناء النظيف)
    await prisma.pathModule.deleteMany({ where: { pathId: learningPath.id } });

    // 3. Create PathModules مربوطة بالـ Course records
    for (let i = 0; i < pathCourses.length; i++) {
      const { slug, title } = pathCourses[i];

      // Find the course (seeded in seedCourses step)
      const course = await prisma.course.findUnique({ where: { slug } });

      await prisma.pathModule.create({
        data: {
          pathId: learningPath.id,
          order: i + 1,
          title,
          type: 'COURSE',
          status: course ? 'PUBLISHED' : 'COMING_SOON',
          courseId: course?.id ?? null, // ← الربط الفعلي
        },
      });
    }

    console.log(`  ✅ ${pathFields.slug} (${pathCourses.length} modules)`);
  }
}
