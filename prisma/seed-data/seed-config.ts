// prisma/seed-data/seed-config.ts
// ═══════════════════════════════════════════════════════════════════
//  MASTER SEED CONFIG
//  ► لإضافة كورس: أضف JSON في course-data/ + أضف entry في COURSES_META
//  ► لإضافة لاب:  أضف entry في LABS_META
//  ► لإضافة مسار: أضف entry في PATHS_META
//  ثم شغّل: npx prisma db seed
// ═══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────
export type CourseColor =
  | 'EMERALD'
  | 'BLUE'
  | 'VIOLET'
  | 'ORANGE'
  | 'ROSE'
  | 'CYAN';
export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseAccess = 'FREE' | 'PRO' | 'PREMIUM';
export type CourseContentType = 'PRACTICAL' | 'THEORETICAL' | 'MIXED';
export type CourseCategory =
  | 'WEB_SECURITY'
  | 'PENETRATION_TESTING'
  | 'MALWARE_ANALYSIS'
  | 'CLOUD_SECURITY'
  | 'FUNDAMENTALS'
  | 'CRYPTOGRAPHY'
  | 'NETWORK_SECURITY'
  | 'TOOLS_AND_TECHNIQUES'
  | 'CAREER_AND_INDUSTRY';
export type LabExecutionMode = 'FRONTEND' | 'SHARED_BACKEND' | 'DOCKER';
export type PathModuleType = 'COURSE' | 'LAB' | 'QUIZ' | 'PROJECT';

// ── Interfaces ─────────────────────────────────────────────────────
export interface CourseMeta {
  /** اسم ملف الـ JSON بالكامل داخل course-data/ */
  jsonFile: string;
  /** الـ slug الفريد في الـ DB */
  slug: string;
  color: CourseColor;
  estimatedHours: number;
  access: CourseAccess;
  difficulty: CourseDifficulty;
  category: CourseCategory;
  contentType: CourseContentType;
  isNew?: boolean;
  isFeatured?: boolean;
  thumbnail?: string;
  /** Slugs of labs linked to this course (many-to-many) */
  labSlugs?: string[];
  /** Badge codes awarded when user completes this course */
  badgeCodes?: string[];
  skills?: string[];
  ar_skills?: string[];
  tags?: string[];
  /** Override auto-extracted topic titles (optional) */
  topics?: string[];
  ar_topics?: string[];
}

export interface LabMeta {
  slug: string;
  title: string;
  ar_title?: string;
  description?: string;
  ar_description?: string;
  difficulty: CourseDifficulty;
  category: CourseCategory;
  executionMode: LabExecutionMode;
  xpReward?: number;
  pointsReward?: number;
  /** Duration in minutes */
  duration?: number;
  skills?: string[];
  imageUrl?: string;
  isPublished?: boolean;
  flagAnswer?: string;
  maxAttempts?: number;
  timeLimit?: number;
  engineConfig?: Record<string, unknown>;
  steps?: unknown;
}

export interface PathModuleEntry {
  type: PathModuleType;
  /** slug of the linked Course or Lab */
  slug: string;
  order: number;
  /** Override title (optional — defaults to the resource title) */
  title?: string;
  ar_title?: string;
  estimatedHours?: number;
  isLocked?: boolean;
}

export interface PathMeta {
  slug: string;
  title: string;
  ar_title?: string;
  description?: string;
  ar_description?: string;
  color: CourseColor;
  difficulty: CourseDifficulty;
  isNew?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  tags?: string[];
  skills?: string[];
  ar_skills?: string[];
  modules: PathModuleEntry[];
}

// ═══════════════════════════════════════════════════════════════════
//  COURSES — أضف كورس جديد هنا
// ═══════════════════════════════════════════════════════════════════
export const COURSES_META: CourseMeta[] = [
  // ── موجودة في الـ paths (slugs مصلحة) ──────────────────────────

  {
    jsonFile: 'Introduction to Cyber Security Fundamentals.json',
    slug: 'introduction-to-cybersecurity', // standalone مش في paths
    color: 'EMERALD',
    estimatedHours: 2,
    access: 'FREE',
    difficulty: 'BEGINNER',
    category: 'FUNDAMENTALS',
    contentType: 'THEORETICAL',
    isNew: true,
    isFeatured: true,
    skills: ['CIA Triad', 'Threat Analysis', 'Security Concepts'],
    ar_skills: ['مثلث CIA', 'تحليل التهديدات', 'مفاهيم الأمن'],
    tags: ['beginner', 'fundamentals'],
  },
  {
    jsonFile: 'Networking Basics Part 1 - V2.json',
    slug: 'networking-basics-part-1', // standalone
    color: 'BLUE',
    estimatedHours: 3,
    access: 'FREE',
    difficulty: 'BEGINNER',
    category: 'NETWORK_SECURITY',
    contentType: 'THEORETICAL',
    skills: ['OSI Model', 'TCP/IP', 'Network Basics'],
    ar_skills: ['نموذج OSI', 'TCP/IP', 'أساسيات الشبكات'],
    tags: ['networking', 'beginner'],
  },
  {
    jsonFile: 'Networking Basics Part 2.json',
    slug: 'networking-basics-part-2', // standalone
    color: 'BLUE',
    estimatedHours: 4,
    access: 'FREE',
    difficulty: 'INTERMEDIATE',
    category: 'NETWORK_SECURITY',
    contentType: 'MIXED',
    skills: ['Subnetting', 'Routing', 'Switching'],
    ar_skills: ['التقسيم الشبكي', 'التوجيه', 'التحويل'],
    tags: ['networking', 'intermediate'],
  },
  {
    jsonFile: 'Network Protocols.json',
    slug: 'network-protocols', // standalone
    color: 'CYAN',
    estimatedHours: 5,
    access: 'FREE',
    difficulty: 'INTERMEDIATE',
    category: 'NETWORK_SECURITY',
    contentType: 'THEORETICAL',
    skills: ['HTTP', 'DNS', 'FTP', 'SMTP'],
    ar_skills: ['HTTP', 'DNS', 'FTP', 'SMTP'],
    tags: ['protocols', 'network'],
  },

  // ── introduction-cybersecurity path ────────────────────────────

  {
    jsonFile: 'Network Analysis & Monitoring.json',
    slug: 'wireshark-packet-analysis-pro', // ← slug مصلح
    color: 'CYAN',
    estimatedHours: 5,
    access: 'PRO',
    difficulty: 'INTERMEDIATE',
    category: 'NETWORK_SECURITY',
    contentType: 'PRACTICAL',
    skills: ['Wireshark', 'Packet Analysis', 'Traffic Monitoring'],
    ar_skills: ['Wireshark', 'تحليل الحزم', 'مراقبة الشبكة'],
    tags: ['network', 'wireshark', 'analysis'],
  },
  {
    jsonFile: 'Network Security Tools.json',
    slug: 'nmap-network-discovery-mastery', // ← slug مصلح
    color: 'ORANGE',
    estimatedHours: 3,
    access: 'PRO',
    difficulty: 'INTERMEDIATE',
    category: 'TOOLS_AND_TECHNIQUES',
    contentType: 'PRACTICAL',
    skills: ['Nmap', 'Nessus', 'Security Scanning'],
    ar_skills: ['Nmap', 'Nessus', 'فحص الأمان'],
    tags: ['tools', 'nmap', 'scanning'],
  },
  {
    jsonFile: 'sql-injection.json',
    slug: 'owasp-sql-injection-sqli', // ← كان ناقص خالص
    color: 'ROSE',
    estimatedHours: 4,
    access: 'FREE',
    difficulty: 'INTERMEDIATE',
    category: 'WEB_SECURITY',
    contentType: 'MIXED',
    skills: ['SQL Injection', 'Database Security', 'OWASP'],
    ar_skills: ['حقن SQL', 'أمن قواعد البيانات', 'OWASP'],
    tags: ['owasp', 'sqli', 'web'],
  },
  {
    jsonFile: 'OWASP-top-10-XSS&CSRF.json',
    slug: 'owasp-xss-csrf', // ← slug مصلح
    color: 'ROSE',
    estimatedHours: 3,
    access: 'FREE',
    difficulty: 'INTERMEDIATE',
    category: 'WEB_SECURITY',
    contentType: 'MIXED',
    skills: ['XSS', 'CSRF', 'Web Security'],
    ar_skills: ['XSS', 'CSRF', 'أمن الويب'],
    tags: ['owasp', 'xss', 'csrf'],
  },
  {
    jsonFile: 'OWASP Top 10 - Authentication & Authorization.json',
    slug: 'owasp-authentication-authorization', // ← slug مصلح
    color: 'ORANGE',
    estimatedHours: 4,
    access: 'FREE',
    difficulty: 'INTERMEDIATE',
    category: 'WEB_SECURITY',
    contentType: 'MIXED',
    skills: ['OWASP', 'Authentication', 'Authorization'],
    ar_skills: ['OWASP', 'المصادقة', 'التفويض'],
    tags: ['owasp', 'auth', 'web'],
  },
  {
    jsonFile: 'Active Directory.json',
    slug: 'active-directory-fundamentals', // ← slug مصلح
    color: 'VIOLET',
    estimatedHours: 4,
    access: 'PRO',
    difficulty: 'INTERMEDIATE',
    category: 'NETWORK_SECURITY',
    contentType: 'THEORETICAL',
    skills: ['Active Directory', 'LDAP', 'Group Policy'],
    ar_skills: ['Active Directory', 'LDAP', 'سياسات المجموعة'],
    tags: ['active-directory', 'windows'],
  },
  {
    jsonFile: 'active-directory-attacks&enumeration.json',
    slug: 'ad-attacks-enumeration', // ← slug مصلح
    color: 'ROSE',
    estimatedHours: 6,
    access: 'PRO',
    difficulty: 'ADVANCED',
    category: 'PENETRATION_TESTING',
    contentType: 'PRACTICAL',
    isNew: true,
    isFeatured: true,
    skills: ['Kerberoasting', 'Pass-the-Hash', 'BloodHound'],
    ar_skills: ['Kerberoasting', 'Pass-the-Hash', 'BloodHound'],
    tags: ['active-directory', 'pentest', 'advanced'],
  },

  // ── كورسات موجودة لكن مش في paths بعد ─────────────────────────

  {
    jsonFile: 'careers-in-cybersecurity-from-soc-to-cloud.json',
    slug: 'careers-in-cybersecurity-from-soc-to-cloud',
    color: 'EMERALD',
    estimatedHours: 3,
    access: 'FREE',
    difficulty: 'BEGINNER',
    category: 'CAREER_AND_INDUSTRY',
    contentType: 'THEORETICAL',
    skills: ['Career Planning', 'SOC', 'Cloud Security'],
    ar_skills: ['التخطيط المهني', 'SOC', 'أمن السحابة'],
    tags: ['career', 'beginner'],
  },
  {
    jsonFile: 'security-frameworks&compliance.json',
    slug: 'security-frameworks-and-compliance',
    color: 'BLUE',
    estimatedHours: 3,
    access: 'FREE',
    difficulty: 'BEGINNER',
    category: 'FUNDAMENTALS',
    contentType: 'THEORETICAL',
    skills: ['ISO 27001', 'NIST', 'Compliance'],
    ar_skills: ['ISO 27001', 'NIST', 'الامتثال'],
    tags: ['frameworks', 'compliance', 'beginner'],
  },
  {
    jsonFile: 'threats&risk-management.json',
    slug: 'threats-and-risk-management',
    color: 'ORANGE',
    estimatedHours: 3,
    access: 'FREE',
    difficulty: 'BEGINNER',
    category: 'FUNDAMENTALS',
    contentType: 'THEORETICAL',
    skills: ['Risk Management', 'Threat Modeling', 'Risk Assessment'],
    ar_skills: ['إدارة المخاطر', 'نمذجة التهديدات', 'تقييم المخاطر'],
    tags: ['threats', 'risk', 'beginner'],
  },

  // ─── أضف كورس جديد هنا ──────────────────────────────────────────
  // {
  //   jsonFile: 'My New Course.json',
  //   slug: 'my-new-course',
  //   ...
  // },
];

// ═══════════════════════════════════════════════════════════════════
//  LABS — أضف لاب جديد هنا
// ═══════════════════════════════════════════════════════════════════
export const LABS_META: LabMeta[] = [
  // ─── أضف لاب جديد هنا ────────────────────────────────────────
  // {
  //   slug: 'sqli-basics',
  //   title: 'SQL Injection Basics',
  //   ar_title: 'أساسيات حقن SQL',
  //   description: 'Practice SQL injection in a safe environment',
  //   ar_description: 'تدرّب على حقن SQL في بيئة آمنة',
  //   difficulty: 'BEGINNER',
  //   category: 'WEB_SECURITY',
  //   executionMode: 'SHARED_BACKEND',
  //   xpReward: 100,
  //   pointsReward: 50,
  //   duration: 30,
  //   skills: ['SQL Injection', 'Database Security'],
  //   isPublished: true,
  //   engineConfig: { targetUrl: 'http://sqli-lab:3001' },
  // },
];

// ═══════════════════════════════════════════════════════════════════
//  LEARNING PATHS — أضف مسار جديد هنا
// ═══════════════════════════════════════════════════════════════════
export const PATHS_META: PathMeta[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 1 — Pre-Security
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug: 'pre-security',
    title: 'Pre-Security Path',
    ar_title: 'مسار ما قبل الأمن السيبراني',
    description:
      'Build the foundational skills needed before diving into cybersecurity — Linux, Windows, networking, web basics, and scripting.',
    ar_description:
      'طوّر المهارات الأساسية اللازمة قبل الدخول في الأمن السيبراني — لينكس، ويندوز، الشبكات، أساسيات الويب، والسكريبتينج.',
    color: 'EMERALD',
    difficulty: 'BEGINNER',
    isNew: true,
    isFeatured: true,
    isPublished: true,
    tags: [
      'beginner',
      'linux',
      'windows',
      'networking',
      'web',
      'python',
      'scripting',
    ],
    skills: [
      'Linux Administration',
      'Windows Security',
      'Bash Scripting',
      'Web Fundamentals',
      'Cryptography Basics',
      'Python for Security',
      'OSINT',
    ],
    ar_skills: [
      'إدارة لينكس',
      'أمن ويندوز',
      'Bash Scripting',
      'أساسيات الويب',
      'أساسيات التشفير',
      'Python للأمن',
      'OSINT',
    ],
    modules: [
      {
        type: 'COURSE',
        slug: 'introduction-to-cybersecurity',
        order: 1,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'networking-basics-part-1',
        order: 2,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'network-protocols',
        order: 3,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'bash-scripting-for-security',
        order: 4,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'linux-security-hardening',
        order: 5,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'windows-fundamentals',
        order: 6,
        estimatedHours: 3,
      },
      { type: 'COURSE', slug: 'windows-security', order: 7, estimatedHours: 3 },
      {
        type: 'COURSE',
        slug: 'how-the-web-works',
        order: 8,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'web-application-architecture',
        order: 9,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'authentication-deep-dive',
        order: 10,
        estimatedHours: 3,
      },
      {
        type: 'LAB',
        slug: 'cookies-sessions-lab',
        order: 11,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'web-security-basics',
        order: 12,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'cryptography-fundamentals',
        order: 13,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'regular-expressions-for-security',
        order: 14,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'python-for-security-basics',
        order: 15,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'building-your-security-lab',
        order: 16,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'threat-intelligence-osint',
        order: 17,
        estimatedHours: 3,
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 2 — Introduction to Cybersecurity
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug: 'introduction-cybersecurity',
    title: 'Introduction to Cybersecurity',
    ar_title: 'مقدمة في الأمن السيبراني',
    description:
      'A comprehensive hands-on path covering network security, web hacking, Active Directory, privilege escalation, malware analysis, and incident response.',
    ar_description:
      'مسار شامل وعملي يغطي أمن الشبكات، اختراق الويب، Active Directory، رفع الصلاحيات، تحليل البرمجيات الضارة، والاستجابة للحوادث.',
    color: 'VIOLET',
    difficulty: 'INTERMEDIATE',
    isNew: true,
    isFeatured: true,
    isPublished: true,
    tags: [
      'intermediate',
      'network-security',
      'web-hacking',
      'active-directory',
      'privilege-escalation',
      'malware',
      'forensics',
      'incident-response',
    ],
    skills: [
      'Nmap',
      'Wireshark',
      'Burp Suite',
      'Metasploit',
      'Active Directory Attacks',
      'Web Application Hacking',
      'Privilege Escalation',
      'Malware Analysis',
      'Digital Forensics',
      'SIEM & Log Analysis',
    ],
    ar_skills: [
      'Nmap',
      'Wireshark',
      'Burp Suite',
      'Metasploit',
      'هجمات Active Directory',
      'اختراق تطبيقات الويب',
      'رفع الصلاحيات',
      'تحليل البرمجيات الضارة',
      'الجنائيات الرقمية',
      'تحليل السجلات وـ SIEM',
    ],
    modules: [
      {
        type: 'COURSE',
        slug: 'nmap-network-discovery-mastery',
        order: 1,
        estimatedHours: 2,
      },
      {
        type: 'COURSE',
        slug: 'wireshark-packet-analysis-pro',
        order: 2,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'network-attacks-exploitation',
        order: 3,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'network-defense-hardening',
        order: 4,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'vpn-exploitation-security',
        order: 5,
        estimatedHours: 3,
      },
      {
        type: 'COURSE',
        slug: 'burp-suite-web-hacking-essentials',
        order: 6,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'owasp-sql-injection-sqli',
        order: 7,
        estimatedHours: 4,
      },
      { type: 'COURSE', slug: 'owasp-xss-csrf', order: 8, estimatedHours: 3 },
      {
        type: 'COURSE',
        slug: 'owasp-authentication-authorization',
        order: 9,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'api-security-testing',
        order: 10,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'windows-security-advanced',
        order: 11,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'active-directory-fundamentals',
        order: 12,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'ad-attacks-enumeration',
        order: 13,
        estimatedHours: 6,
      },
      {
        type: 'COURSE',
        slug: 'metasploit-exploitation-basics',
        order: 14,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'linux-privilege-escalation',
        order: 15,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'windows-privilege-escalation',
        order: 16,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'password-cracking-techniques',
        order: 17,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'wireless-security-attacks',
        order: 18,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'cryptography-attacks',
        order: 19,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'log-analysis-siem-basics',
        order: 20,
        estimatedHours: 4,
      },
      {
        type: 'COURSE',
        slug: 'malware-analysis-introduction',
        order: 21,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'digital-forensics-basics',
        order: 22,
        estimatedHours: 5,
      },
      {
        type: 'COURSE',
        slug: 'incident-response-methodology',
        order: 23,
        estimatedHours: 4,
      },
    ],
  },

  // ─── أضف مسار جديد هنا ──────────────────────────────────────────
];
