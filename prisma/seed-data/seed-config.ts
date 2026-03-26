// prisma/seed-data/seed-config.ts

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
  jsonFile: string;
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
  labSlugs?: string[];
  badgeCodes?: string[];
  skills?: string[];
  ar_skills?: string[];
  tags?: string[];
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
  slug: string;
  order: number;
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
//  INSTRUCTOR
// ═══════════════════════════════════════════════════════════════════
export const SYSTEM_INSTRUCTOR_ID = 'ec4a19d8-17b3-4a55-97c4-97e13b029b03';

// ═══════════════════════════════════════════════════════════════════
//  COURSES  (26 courses)
// ═══════════════════════════════════════════════════════════════════
export const COURSES_META: CourseMeta[] = [

  // ── 01 · Introduction to Cyber Security ───────────────────────
  {
    jsonFile:       'Introduction to Cyber Security Fundamentals.json',
    slug:           'introduction-to-cybersecurity',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    isNew:          true,
    isFeatured:     true,
    tags:           ['cybersecurity', 'fundamentals', 'beginner', 'intro'],
    skills:         ['Security Concepts', 'CIA Triad', 'Threat Modeling', 'Risk Assessment'],
    ar_skills:      ['مفاهيم الأمن', 'ثالوث CIA', 'نمذجة التهديدات', 'تقييم المخاطر'],
  },

  // ── 02 · Networking Basics Part 1 ─────────────────────────────
  {
    jsonFile:       'Networking Basics Part 1 - V2.json',
    slug:           'networking-basics-part-1',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 5,
    isNew:          true,
    tags:           ['networking', 'fundamentals', 'beginner', 'OSI', 'TCP/IP'],
    skills:         ['OSI Model', 'TCP/IP', 'IP Addressing', 'Subnetting', 'DNS', 'DHCP'],
    ar_skills:      ['نموذج OSI', 'TCP/IP', 'عناوين IP', 'Subnetting', 'DNS', 'DHCP'],
  },

  // ── 03 · Networking Basics Part 2 ─────────────────────────────
  {
    jsonFile:       'Networking Basics Part 2.json',
    slug:           'networking-basics-part-2',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 6,
    tags:           ['networking', 'routing', 'switching', 'firewall', 'VLANs'],
    skills:         ['Routing', 'Switching', 'Firewalls', 'VLANs', 'NAT', 'ACLs'],
    ar_skills:      ['التوجيه', 'التبديل', 'الجدران النارية', 'VLANs', 'NAT', 'ACLs'],
  },

  // ── 04 · Network Protocols ────────────────────────────────────
  {
    jsonFile:       'Network Protocols.json',
    slug:           'network-protocols',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 7,
    tags:           ['networking', 'protocols', 'HTTP', 'FTP', 'SMTP', 'DNS'],
    skills:         ['HTTP/HTTPS', 'FTP', 'SMTP', 'DNS Deep Dive', 'SNMP', 'Protocol Analysis'],
    ar_skills:      ['HTTP/HTTPS', 'FTP', 'SMTP', 'DNS بعمق', 'SNMP', 'تحليل البروتوكولات'],
  },

  // ── 05 · How the Web Works ────────────────────────────────────
  {
    jsonFile:       'How the Web Works.json',
    slug:           'how-the-web-works',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 5,
    isNew:          true,
    tags:           ['web', 'HTTP', 'browsers', 'DNS', 'TLS', 'cookies'],
    skills:         ['HTTP Requests', 'DNS Resolution', 'TLS/SSL', 'Cookies', 'Browser Security', 'Web Architecture'],
    ar_skills:      ['طلبات HTTP', 'DNS Resolution', 'TLS/SSL', 'الكوكيز', 'أمان المتصفح', 'بنية الويب'],
  },

  // ── 06 · Web Application Architecture ────────────────────────
  {
    jsonFile:       'Web Application Architecture.json',
    slug:           'web-application-architecture',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 6,
    tags:           ['web', 'architecture', 'APIs', 'REST', 'frontend', 'backend'],
    skills:         ['REST APIs', 'MVC Architecture', 'Frontend/Backend', 'Databases', 'Authentication Flows'],
    ar_skills:      ['REST APIs', 'معمارية MVC', 'Frontend/Backend', 'قواعد البيانات', 'تدفقات المصادقة'],
  },

  // ── 07 · Cookies & Sessions Lab ───────────────────────────────
  {
    jsonFile:       'Cookies & Sessions Lab-final.json',
    slug:           'cookies-and-sessions',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 4,
    tags:           ['cookies', 'sessions', 'web', 'authentication', 'practical'],
    skills:         ['Cookie Manipulation', 'Session Hijacking', 'JWT Basics', 'Storage Security'],
    ar_skills:      ['التلاعب بالكوكيز', 'اختطاف الجلسات', 'أساسيات JWT', 'أمان التخزين'],
  },

  // ── 08 · Authentication Deep Dive ─────────────────────────────
  {
    jsonFile:       'Authentication Deep Dive.json',
    slug:           'authentication-deep-dive',
    color:          'ROSE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'WEB_SECURITY',
    estimatedHours: 8,
    isNew:          true,
    tags:           ['authentication', 'JWT', 'OAuth', 'MFA', 'SSO', 'web-security'],
    skills:         ['JWT Security', 'OAuth 2.0', 'MFA Implementation', 'SSO', 'Password Hashing', 'Auth Bypass'],
    ar_skills:      ['أمان JWT', 'OAuth 2.0', 'تطبيق MFA', 'SSO', 'تجزئة كلمات المرور', 'تجاوز المصادقة'],
  },

  // ── 09 · Linux Fundamentals Part 1 ───────────────────────────
  {
    jsonFile:       'Linux Fundamentals Part 1.json',
    slug:           'linux-fundamentals-part-1',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'FUNDAMENTALS',
    estimatedHours: 5,
    isNew:          true,
    tags:           ['linux', 'fundamentals', 'CLI', 'beginner', 'terminal'],
    skills:         ['Linux CLI', 'File System', 'Users & Permissions', 'Package Management', 'Text Editors'],
    ar_skills:      ['سطر أوامر لينكس', 'نظام الملفات', 'المستخدمون والصلاحيات', 'إدارة الحزم', 'محررات النصوص'],
  },

  // ── 10 · Linux Fundamentals Part 2 ───────────────────────────
  {
    jsonFile:       'Linux Fundamentals Part 2.json',
    slug:           'linux-fundamentals-part-2',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'FUNDAMENTALS',
    estimatedHours: 6,
    tags:           ['linux', 'processes', 'networking', 'shell', 'scripting'],
    skills:         ['Process Management', 'Cron Jobs', 'Linux Networking', 'Shell Scripting Basics', 'System Monitoring'],
    ar_skills:      ['إدارة العمليات', 'Cron Jobs', 'شبكات لينكس', 'أساسيات سكريبت الشل', 'مراقبة النظام'],
  },

  // ── 11 · Linux Security & Hardening ──────────────────────────
  {
    jsonFile:       'Linux Security & Hardening.json',
    slug:           'linux-security-and-hardening',
    color:          'EMERALD',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 7,
    tags:           ['linux', 'hardening', 'security', 'SELinux', 'firewall', 'audit'],
    skills:         ['Linux Hardening', 'SELinux/AppArmor', 'iptables', 'Audit Logs', 'SSH Security', 'sudo Configuration'],
    ar_skills:      ['تصليب لينكس', 'SELinux/AppArmor', 'iptables', 'سجلات التدقيق', 'أمان SSH', 'إعداد sudo'],
  },

  // ── 12 · Windows Fundamentals ─────────────────────────────────
  {
    jsonFile:       'Windows Fundamentals.json',
    slug:           'windows-fundamentals',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 5,
    isNew:          true,
    tags:           ['windows', 'fundamentals', 'registry', 'AD', 'powershell'],
    skills:         ['Windows Registry', 'Active Directory Basics', 'PowerShell Basics', 'Windows Services', 'User Management'],
    ar_skills:      ['ريجيستري ويندوز', 'أساسيات Active Directory', 'أساسيات PowerShell', 'خدمات ويندوز', 'إدارة المستخدمين'],
  },

  // ── 13 · Windows Security ─────────────────────────────────────
  {
    jsonFile:       'Windows Security.json',
    slug:           'windows-security',
    color:          'BLUE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'FUNDAMENTALS',
    estimatedHours: 7,
    tags:           ['windows', 'security', 'hardening', 'event-logs', 'defender'],
    skills:         ['Windows Hardening', 'Event Log Analysis', 'Windows Defender', 'BitLocker', 'Group Policy', 'UAC'],
    ar_skills:      ['تصليب ويندوز', 'تحليل سجلات الأحداث', 'Windows Defender', 'BitLocker', 'Group Policy', 'UAC'],
  },

  // ── 14 · Bash Scripting ───────────────────────────────────────
  {
    jsonFile:       'Bash Scripting-final.json',
    slug:           'bash-scripting',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 5,
    tags:           ['bash', 'scripting', 'automation', 'linux', 'shell'],
    skills:         ['Bash Scripting', 'Shell Automation', 'Regex in Bash', 'Cron Automation', 'Security Scripts'],
    ar_skills:      ['Bash Scripting', 'أتمتة الشل', 'Regex في Bash', 'أتمتة Cron', 'سكريبتات الأمن'],
  },

  // ── 15 · Python for Security Basics ──────────────────────────
  {
    jsonFile:       'Python for Security Basics-f.json',
    slug:           'python-for-security-basics',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 8,
    isNew:          true,
    tags:           ['python', 'security', 'scripting', 'automation', 'beginner'],
    skills:         ['Python Basics', 'Socket Programming', 'Web Scraping', 'File Analysis', 'Port Scanner', 'Exploit Scripting'],
    ar_skills:      ['أساسيات Python', 'برمجة Socket', 'Web Scraping', 'تحليل الملفات', 'Port Scanner', 'سكريبتات الاستغلال'],
  },

  // ── 16 · Regular Expressions for Security ────────────────────
  {
    jsonFile:       'Regular Expressions for Security-f.json',
    slug:           'regular-expressions-for-security',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 4,
    tags:           ['regex', 'pattern-matching', 'log-analysis', 'security', 'tools'],
    skills:         ['Regex Patterns', 'Log Parsing', 'Input Validation', 'SIEM Regex', 'Pattern Detection'],
    ar_skills:      ['أنماط Regex', 'تحليل السجلات', 'التحقق من المدخلات', 'SIEM Regex', 'اكتشاف الأنماط'],
  },

  // ── 17 · Cryptography Fundamentals ───────────────────────────
  {
    jsonFile:       'Cryptography Fundamentals-f.json',
    slug:           'cryptography-fundamentals',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'CRYPTOGRAPHY',
    estimatedHours: 6,
    isNew:          true,
    tags:           ['cryptography', 'encryption', 'hashing', 'PKI', 'TLS', 'AES'],
    skills:         ['Symmetric Encryption', 'Asymmetric Encryption', 'Hashing Algorithms', 'PKI & Certificates', 'TLS Handshake'],
    ar_skills:      ['التشفير المتماثل', 'التشفير غير المتماثل', 'خوارزميات التجزئة', 'PKI والشهادات', 'TLS Handshake'],
  },

  // ── 18 · VPN & Secure Communications ─────────────────────────
  {
    jsonFile:       'VPN & Secure Communications.json',
    slug:           'vpn-and-secure-communications',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 4,
    tags:           ['VPN', 'TLS', 'IPSec', 'secure-communications', 'tunneling'],
    skills:         ['VPN Protocols', 'IPSec', 'OpenVPN', 'WireGuard', 'SSL/TLS', 'Tunneling'],
    ar_skills:      ['بروتوكولات VPN', 'IPSec', 'OpenVPN', 'WireGuard', 'SSL/TLS', 'الأنفاق'],
  },

  // ── 19 · Network Analysis & Monitoring ───────────────────────
  {
    jsonFile:       'Network Analysis & Monitoring-f.json',
    slug:           'network-analysis-and-monitoring',
    color:          'CYAN',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 8,
    tags:           ['wireshark', 'tcpdump', 'traffic-analysis', 'IDS', 'monitoring'],
    skills:         ['Wireshark', 'tcpdump', 'Traffic Analysis', 'IDS/IPS', 'Network Forensics', 'Packet Capture'],
    ar_skills:      ['Wireshark', 'tcpdump', 'تحليل حركة المرور', 'IDS/IPS', 'جنائيات الشبكة', 'التقاط الحزم'],
  },

  // ── 20 · Network Security Tools ──────────────────────────────
  {
    jsonFile:       'Network Security Tools.json',
    slug:           'network-security-tools',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 7,
    tags:           ['nmap', 'nessus', 'metasploit', 'tools', 'scanning', 'recon'],
    skills:         ['Nmap', 'Nessus', 'Nikto', 'Netcat', 'Metasploit Basics', 'Vulnerability Scanning'],
    ar_skills:      ['Nmap', 'Nessus', 'Nikto', 'Netcat', 'أساسيات Metasploit', 'فحص الثغرات'],
  },

  // ── 21 · Web Security Basics ──────────────────────────────────
  {
    jsonFile:       'Web Security Basics-f.json',
    slug:           'web-security-basics',
    color:          'ROSE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'WEB_SECURITY',
    estimatedHours: 9,
    isNew:          true,
    isFeatured:     true,
    tags:           ['web-security', 'OWASP', 'XSS', 'SQLi', 'CSRF', 'IDOR'],
    skills:         ['XSS', 'SQL Injection', 'CSRF', 'IDOR', 'OWASP Top 10', 'Burp Suite Basics'],
    ar_skills:      ['XSS', 'SQL Injection', 'CSRF', 'IDOR', 'OWASP Top 10', 'أساسيات Burp Suite'],
  },

  // ── 22 · Threat Intelligence & OSINT ─────────────────────────
  {
    jsonFile:       'Threat Intelligence & OSINT-f.json',
    slug:           'threat-intelligence-and-osint',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'MIXED',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 7,
    tags:           ['OSINT', 'threat-intel', 'recon', 'maltego', 'shodan'],
    skills:         ['OSINT Techniques', 'Maltego', 'Shodan', 'Threat Feeds', 'IOC Analysis', 'Dark Web OSINT'],
    ar_skills:      ['تقنيات OSINT', 'Maltego', 'Shodan', 'Threat Feeds', 'تحليل IOC', 'OSINT الويب المظلم'],
  },

  // ── 23 · Threats & Risk Management ───────────────────────────
  {
    jsonFile:       'Threats & Risk Management.json',
    slug:           'threats-and-risk-management',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    tags:           ['threats', 'risk', 'management', 'GRC', 'fundamentals'],
    skills:         ['Risk Assessment', 'Threat Modeling', 'Vulnerability Management', 'Business Impact Analysis', 'Risk Mitigation'],
    ar_skills:      ['تقييم المخاطر', 'نمذجة التهديدات', 'إدارة الثغرات', 'تحليل أثر الأعمال', 'تخفيف المخاطر'],
  },

  // ── 24 · Security Frameworks & Compliance ────────────────────
  {
    jsonFile:       'Security Frameworks & Compliance.json',
    slug:           'security-frameworks-and-compliance',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    tags:           ['frameworks', 'compliance', 'NIST', 'ISO27001', 'GRC', 'regulations'],
    skills:         ['NIST Framework', 'ISO 27001', 'GDPR Basics', 'PCI-DSS', 'SOC 2', 'GRC'],
    ar_skills:      ['إطار NIST', 'ISO 27001', 'أساسيات GDPR', 'PCI-DSS', 'SOC 2', 'GRC'],
  },

  // ── 25 · Data Protection & Privacy ───────────────────────────
  {
    jsonFile:       'Data Protection & Privacy-f.json',
    slug:           'data-protection-and-privacy',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    tags:           ['data-protection', 'privacy', 'GDPR', 'encryption', 'DLP'],
    skills:         ['Data Classification', 'GDPR', 'Data Encryption', 'DLP', 'Privacy by Design'],
    ar_skills:      ['تصنيف البيانات', 'GDPR', 'تشفير البيانات', 'DLP', 'الخصوصية بالتصميم'],
  },

  // ── 26 · Building Your Security Lab ──────────────────────────
  {
    jsonFile:       'Building Your Security Lab-f.json',
    slug:           'building-your-security-lab',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 5,
    isNew:          true,
    isFeatured:     true,
    tags:           ['homelab', 'virtualbox', 'kali', 'vmware', 'setup', 'beginner'],
    skills:         ['VirtualBox/VMware', 'Kali Linux Setup', 'Network Configuration', 'Vulnerable VMs', 'Lab Automation'],
    ar_skills:      ['VirtualBox/VMware', 'إعداد Kali Linux', 'إعداد الشبكة', 'VMs الضعيفة', 'أتمتة المختبر'],
  },

  // ── 27 · Careers in Cybersecurity ────────────────────────────
  {
    jsonFile:       'Careers in Cybersecurity From SOC to Cloud-FINAL.json',
    slug:           'careers-in-cybersecurity',
    color:          'ROSE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'CAREER_AND_INDUSTRY',
    estimatedHours: 3,
    tags:           ['careers', 'SOC', 'cloud-security', 'blue-team', 'red-team', 'certifications'],
    skills:         ['SOC Analyst Path', 'Red Team vs Blue Team', 'Cloud Security Roles', 'Certifications Guide', 'Career Roadmap'],
    ar_skills:      ['مسار محلل SOC', 'الفريق الأحمر مقابل الأزرق', 'أدوار أمن السحابة', 'دليل الشهادات', 'خريطة المسار المهني'],
  },
];

// ═══════════════════════════════════════════════════════════════════
//  LABS
// ═══════════════════════════════════════════════════════════════════
export const LABS_META: LabMeta[] = [];

// ═══════════════════════════════════════════════════════════════════
//  LEARNING PATHS
// ═══════════════════════════════════════════════════════════════════
export const PATHS_META: PathMeta[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 1 — Pre-Security
  //  26 courses ordered by learning progression
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'pre-security',
    title:          'Pre-Security Path',
    ar_title:       'مسار ما قبل الأمن السيبراني',
    description:    'Build the foundational skills needed before diving into cybersecurity — Linux, Windows, networking, web basics, and scripting.',
    ar_description: 'طوّر المهارات الأساسية اللازمة قبل الدخول في الأمن السيبراني — لينكس، ويندوز، الشبكات، أساسيات الويب، والسكريبتينج.',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    isNew:          true,
    isFeatured:     true,
    isPublished:    true,
    tags:           ['beginner', 'linux', 'windows', 'networking', 'web', 'python', 'scripting'],
    skills:         ['Linux Administration', 'Windows Security', 'Bash Scripting', 'Web Fundamentals', 'Cryptography Basics', 'Python for Security', 'OSINT'],
    ar_skills:      ['إدارة لينكس', 'أمن ويندوز', 'Bash Scripting', 'أساسيات الويب', 'أساسيات التشفير', 'Python للأمن', 'OSINT'],
    modules: [
      // ── PHASE 1: Foundations ────────────────────────────────────
      { type: 'COURSE', slug: 'introduction-to-cybersecurity',       order: 1,  estimatedHours: 4,  isLocked: false, title: 'Introduction to Cybersecurity' },
      { type: 'COURSE', slug: 'threats-and-risk-management',         order: 2,  estimatedHours: 4,  isLocked: false, title: 'Threats & Risk Management' },
      { type: 'COURSE', slug: 'security-frameworks-and-compliance',  order: 3,  estimatedHours: 4,  isLocked: false, title: 'Security Frameworks & Compliance' },
      { type: 'COURSE', slug: 'data-protection-and-privacy',         order: 4,  estimatedHours: 4,  isLocked: false, title: 'Data Protection & Privacy' },
      // ── PHASE 2: Networking ─────────────────────────────────────
      { type: 'COURSE', slug: 'networking-basics-part-1',            order: 5,  estimatedHours: 5,  isLocked: false, title: 'Networking Basics Part 1' },
      { type: 'COURSE', slug: 'networking-basics-part-2',            order: 6,  estimatedHours: 6,  isLocked: false, title: 'Networking Basics Part 2' },
      { type: 'COURSE', slug: 'network-protocols',                   order: 7,  estimatedHours: 7,  isLocked: false, title: 'Network Protocols' },
      { type: 'COURSE', slug: 'vpn-and-secure-communications',       order: 8,  estimatedHours: 4,  isLocked: false, title: 'VPN & Secure Communications' },
      { type: 'COURSE', slug: 'network-analysis-and-monitoring',     order: 9,  estimatedHours: 8,  isLocked: false, title: 'Network Analysis & Monitoring' },
      // ── PHASE 3: Linux ──────────────────────────────────────────
      { type: 'COURSE', slug: 'linux-fundamentals-part-1',           order: 10, estimatedHours: 5,  isLocked: false, title: 'Linux Fundamentals Part 1' },
      { type: 'COURSE', slug: 'linux-fundamentals-part-2',           order: 11, estimatedHours: 6,  isLocked: false, title: 'Linux Fundamentals Part 2' },
      { type: 'COURSE', slug: 'linux-security-and-hardening',        order: 12, estimatedHours: 7,  isLocked: false, title: 'Linux Security & Hardening' },
      // ── PHASE 4: Windows ────────────────────────────────────────
      { type: 'COURSE', slug: 'windows-fundamentals',                order: 13, estimatedHours: 5,  isLocked: false, title: 'Windows Fundamentals' },
      { type: 'COURSE', slug: 'windows-security',                    order: 14, estimatedHours: 7,  isLocked: false, title: 'Windows Security' },
      // ── PHASE 5: Scripting & Tools ──────────────────────────────
      { type: 'COURSE', slug: 'bash-scripting',                      order: 15, estimatedHours: 5,  isLocked: false, title: 'Bash Scripting' },
      { type: 'COURSE', slug: 'python-for-security-basics',          order: 16, estimatedHours: 8,  isLocked: false, title: 'Python for Security Basics' },
      { type: 'COURSE', slug: 'regular-expressions-for-security',    order: 17, estimatedHours: 4,  isLocked: false, title: 'Regular Expressions for Security' },
      // ── PHASE 6: Web Foundations ────────────────────────────────
      { type: 'COURSE', slug: 'how-the-web-works',                   order: 18, estimatedHours: 5,  isLocked: false, title: 'How the Web Works' },
      { type: 'COURSE', slug: 'web-application-architecture',        order: 19, estimatedHours: 6,  isLocked: false, title: 'Web Application Architecture' },
      { type: 'COURSE', slug: 'cookies-and-sessions',                order: 20, estimatedHours: 4,  isLocked: false, title: 'Cookies & Sessions' },
      { type: 'COURSE', slug: 'authentication-deep-dive',            order: 21, estimatedHours: 8,  isLocked: false, title: 'Authentication Deep Dive' },
      // ── PHASE 7: Crypto + Tools ─────────────────────────────────
      { type: 'COURSE', slug: 'cryptography-fundamentals',           order: 22, estimatedHours: 6,  isLocked: false, title: 'Cryptography Fundamentals' },
      { type: 'COURSE', slug: 'building-your-security-lab',          order: 23, estimatedHours: 5,  isLocked: false, title: 'Building Your Security Lab' },
      { type: 'COURSE', slug: 'network-security-tools',              order: 24, estimatedHours: 7,  isLocked: false, title: 'Network Security Tools' },
      { type: 'COURSE', slug: 'threat-intelligence-and-osint',       order: 25, estimatedHours: 7,  isLocked: false, title: 'Threat Intelligence & OSINT' },
      // ── PHASE 8: Web Security intro ─────────────────────────────
      { type: 'COURSE', slug: 'web-security-basics',                 order: 26, estimatedHours: 9,  isLocked: false, title: 'Web Security Basics' },
      // ── FINALE ──────────────────────────────────────────────────
      { type: 'COURSE', slug: 'careers-in-cybersecurity',            order: 27, estimatedHours: 3,  isLocked: false, title: 'Careers in Cybersecurity' },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 2 — Introduction to Cybersecurity
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'introduction-cybersecurity',
    title:          'Introduction to Cybersecurity',
    ar_title:       'مقدمة في الأمن السيبراني',
    description:    'A comprehensive hands-on path covering network security, web hacking, Active Directory, privilege escalation, malware analysis, and incident response.',
    ar_description: 'مسار شامل وعملي يغطي أمن الشبكات، اختراق الويب، Active Directory، رفع الصلاحيات، تحليل البرمجيات الضارة، والاستجابة للحوادث.',
    color:          'VIOLET',
    difficulty:     'INTERMEDIATE',
    isNew:          true,
    isFeatured:     true,
    isPublished:    true,
    tags:           ['intermediate', 'network-security', 'web-hacking', 'active-directory', 'privilege-escalation', 'malware', 'forensics', 'incident-response'],
    skills:         ['Nmap', 'Wireshark', 'Burp Suite', 'Metasploit', 'Active Directory Attacks', 'Web Application Hacking', 'Privilege Escalation', 'Malware Analysis', 'Digital Forensics', 'SIEM & Log Analysis'],
    ar_skills:      ['Nmap', 'Wireshark', 'Burp Suite', 'Metasploit', 'هجمات Active Directory', 'اختراق تطبيقات الويب', 'رفع الصلاحيات', 'تحليل البرمجيات الضارة', 'الجنائيات الرقمية', 'تحليل السجلات وـ SIEM'],
    modules: [
      // — Will be filled when intermediate courses are added —
    ],
  },
];
