// prisma/seed-data/paths.ts
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
      'This path covers the essential building blocks of IT, including networking basics, protocols, and cybersecurity fundamentals.',
    ar_longDescription:
      'يغطي هذا المسار اللبنات الأساسية لتكنولوجيا المعلومات.',
    iconName: 'Laptop',
    color: 'BLUE' as CourseColor,
    difficulty: 'BEGINNER' as Difficulty,
    order: 1,
    isPublished: true,
    isFeatured: true,
    tags: ['IT', 'OS', 'Networking', 'Fundamentals'],
    ar_tags: ['تكنولوجيا المعلومات', 'أنظمة التشغيل', 'شبكات', 'أساسيات'],
    courses: [
      {
        slug: 'introduction-to-cyber-security-fundamentals',
        title: 'Introduction to Cyber Security',
      },
      {
        slug: 'networking-basics-part-1-v2',
        title: 'Networking Basics Part 1',
      },
      { slug: 'networking-basics-part-2', title: 'Networking Basics Part 2' },
      { slug: 'network-protocols', title: 'Network Protocols' },
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
      'Dive into HTTP, web architectures, and the core security mechanisms that protect modern web applications.',
    ar_longDescription: 'تعمق في بروتوكول HTTP وهيكلية الويب وآليات الأمان.',
    iconName: 'Globe',
    color: 'CYAN' as CourseColor,
    difficulty: 'BEGINNER' as Difficulty,
    order: 2,
    isPublished: true,
    isFeatured: true,
    tags: ['Web', 'HTTP', 'Security Basics'],
    ar_tags: ['ويب', 'بروتوكولات', 'أساسيات الأمن'],
    courses: [
      {
        slug: 'introduction-to-cyber-security-fundamentals',
        title: 'Cyber Security Fundamentals',
      },
      { slug: 'network-protocols', title: 'Network Protocols' },
      { slug: 'owasp-top-10-xssandcsrf', title: 'OWASP: XSS & CSRF' },
      {
        slug: 'owasp-top-10-authentication-and-authorization',
        title: 'OWASP: Authentication & Authorization',
      },
    ],
  },
  {
    slug: 'scripting-applied-cryptography',
    title: 'Scripting & Applied Cryptography',
    ar_title: 'البرمجة والتشفير التطبيقي',
    description:
      'Learn automation, scripting, and the mathematics behind securing data.',
    ar_description: 'تعلم الأتمتة والبرمجة والرياضيات وراء تأمين البيانات.',
    longDescription:
      'Automate tasks and understand both the foundations and vulnerabilities of cryptographic systems.',
    ar_longDescription: 'قم بأتمتة المهام وافهم أساسيات وثغرات أنظمة التشفير.',
    iconName: 'Code',
    color: 'VIOLET' as CourseColor,
    difficulty: 'INTERMEDIATE' as Difficulty,
    order: 3,
    isPublished: true,
    isFeatured: false,
    tags: ['Scripting', 'Cryptography', 'Security'],
    ar_tags: ['برمجة', 'تشفير', 'أمن'],
    courses: [
      {
        slug: 'security-frameworksandcompliance',
        title: 'Security Frameworks & Compliance',
      },
      { slug: 'threatsandrisk-management', title: 'Threats & Risk Management' },
      { slug: 'network-security-tools', title: 'Network Security Tools' },
    ],
  },
  {
    slug: 'network-security-traffic-analysis',
    title: 'Network Security & Traffic Analysis',
    ar_title: 'أمن الشبكات وتحليل البيانات',
    description:
      'Master network protocols, discover vulnerabilities, and analyze network traffic.',
    ar_description: 'أتقن بروتوكولات الشبكة واكتشف الثغرات وحلل حركة البيانات.',
    longDescription:
      'Learn to use essential tools, understand wireless and VPN vulnerabilities, and learn how to defend network infrastructures.',
    ar_longDescription: 'تعلم استخدام الأدوات الأساسية وافهم ثغرات الشبكات.',
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
        slug: 'networking-basics-part-1-v2',
        title: 'Networking Basics Part 1',
      },
      { slug: 'networking-basics-part-2', title: 'Networking Basics Part 2' },
      { slug: 'network-protocols', title: 'Network Protocols' },
      {
        slug: 'network-analysis-and-monitoring',
        title: 'Network Analysis & Monitoring',
      },
      { slug: 'network-security-tools', title: 'Network Security Tools' },
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
      'Dive deep into OWASP Top 10 vulnerabilities including SQLi, XSS, CSRF, and authentication flaws.',
    ar_longDescription:
      'تعمق في ثغرات الـ OWASP بما في ذلك حقن SQL والـ XSS والـ CSRF.',
    iconName: 'ShieldAlert',
    color: 'ROSE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 5,
    isPublished: true,
    isFeatured: true,
    tags: ['Web Hacking', 'Bug Bounty', 'OWASP', 'SQL Injection'],
    ar_tags: ['اختراق الويب', 'اكتشاف الثغرات', 'أواسب', 'حقن SQL'],
    courses: [
      { slug: 'sql-injection', title: 'SQL Injection' },
      { slug: 'owasp-top-10-xssandcsrf', title: 'OWASP: XSS & CSRF' },
      {
        slug: 'owasp-top-10-authentication-and-authorization',
        title: 'OWASP: Authentication & Authorization',
      },
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
      'Understand Active Directory architecture, perform enumeration and attacks.',
    ar_longDescription:
      'افهم هيكلية Active Directory وقم بعمليات جمع المعلومات والهجمات.',
    iconName: 'Server',
    color: 'ORANGE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 6,
    isPublished: true,
    isFeatured: false,
    tags: ['Active Directory', 'Enterprise', 'Windows', 'Red Team'],
    ar_tags: ['أكتيف دايركتوري', 'شركات', 'ويندوز', 'الفريق الأحمر'],
    courses: [
      { slug: 'active-directory', title: 'Active Directory Fundamentals' },
      {
        slug: 'active-directory-attacksandenumeration',
        title: 'AD Attacks & Enumeration',
      },
      { slug: 'network-security-tools', title: 'Network Security Tools' },
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
      'Master exploitation techniques and escalate privileges on Windows and Linux systems.',
    ar_longDescription:
      'أتقن تقنيات الاستغلال وتصعيد الصلاحيات على أنظمة ويندوز ولينكس.',
    iconName: 'Key',
    color: 'ROSE' as CourseColor,
    difficulty: 'ADVANCED' as Difficulty,
    order: 7,
    isPublished: true,
    isFeatured: false,
    tags: ['PrivEsc', 'Exploitation', 'Metasploit'],
    ar_tags: ['تصعيد صلاحيات', 'استغلال', 'ميتاسبلويت'],
    courses: [
      {
        slug: 'active-directory-attacksandenumeration',
        title: 'AD Attacks & Enumeration',
      },
      { slug: 'sql-injection', title: 'SQL Injection' },
      { slug: 'network-security-tools', title: 'Network Security Tools' },
      {
        slug: 'owasp-top-10-authentication-and-authorization',
        title: 'OWASP: Authentication & Authorization',
      },
    ],
  },
  {
    slug: 'defensive-security-blue-teaming',
    title: 'Defensive Security & Blue Teaming',
    ar_title: 'الأمن الدفاعي والاستجابة للحوادث',
    description: 'Learn to detect, analyze, and respond to cyber threats.',
    ar_description: 'تعلم كيفية اكتشاف وتحليل والاستجابة للتهديدات السيبرانية.',
    longDescription:
      'Master log analysis, SIEM solutions, forensics, malware analysis, and incident response.',
    ar_longDescription:
      'أتقن تحليل السجلات وحلول SIEM والأدلة الجنائية الرقمية وتحليل البرمجيات الخبيثة.',
    iconName: 'ShieldCheck',
    color: 'EMERALD' as CourseColor,
    difficulty: 'INTERMEDIATE' as Difficulty,
    order: 8,
    isPublished: true,
    isFeatured: true,
    tags: ['Blue Team', 'SIEM', 'Forensics', 'Incident Response'],
    ar_tags: ['الفريق الأزرق', 'سجلات', 'أدلة جنائية', 'استجابة للحوادث'],
    courses: [
      {
        slug: 'careers-in-cybersecurity-from-soc-to-cloud',
        title: 'Careers in Cybersecurity',
      },
      { slug: 'threatsandrisk-management', title: 'Threats & Risk Management' },
      {
        slug: 'security-frameworksandcompliance',
        title: 'Security Frameworks & Compliance',
      },
      {
        slug: 'network-analysis-and-monitoring',
        title: 'Network Analysis & Monitoring',
      },
    ],
  },
];

export async function seedLearningPaths(prisma: PrismaClient) {
  console.log('🛣️  Seeding learning paths...');

  for (const pathData of learningPathsData) {
    const { courses: pathCourses, ...pathFields } = pathData;

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

    await prisma.pathModule.deleteMany({ where: { pathId: learningPath.id } });

    for (let i = 0; i < pathCourses.length; i++) {
      const { slug, title } = pathCourses[i];
      const course = await prisma.course.findUnique({ where: { slug } });

      await prisma.pathModule.create({
        data: {
          pathId: learningPath.id,
          order: i + 1,
          title,
          type: 'COURSE',
          status: course ? 'PUBLISHED' : 'COMING_SOON',
          courseId: course?.id ?? null,
        },
      });

      if (!course)
        console.warn(`  ⚠️  Course not found: ${slug} — set as COMING_SOON`);
    }

    console.log(`  ✅ ${pathFields.slug} (${pathCourses.length} modules)`);
  }
}
