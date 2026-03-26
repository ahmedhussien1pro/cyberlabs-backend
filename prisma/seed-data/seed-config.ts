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
//  COURSES — Introduction to Cybersecurity Path (14 courses)
//  ✔️ Pre-Security courses already seeded — removed from here
// ═══════════════════════════════════════════════════════════════════
export const COURSES_META: CourseMeta[] = [

  // ── 01 · Active Directory Fundamentals ─────────────────────────
  {
    jsonFile:       'Active Directory.json',
    slug:           'active-directory-fundamentals',
    color:          'BLUE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 7,
    isNew:          true,
    isFeatured:     true,
    tags:           ['active-directory', 'windows', 'AD', 'LDAP', 'Kerberos', 'domain'],
    skills:         ['AD Structure', 'Kerberos Authentication', 'LDAP', 'Group Policy', 'AD Users & Groups', 'Domain Controllers'],
    ar_skills:      ['بنية AD', 'مصادقة Kerberos', 'LDAP', 'سياسات المجموعة', 'مستخدمو AD ومجموعاته', 'تحكم النطاق'],
  },

  // ── 02 · Active Directory Attacks & Enumeration ────────────────
  {
    jsonFile:       'Active Directory Attacks & Enumeration.json',
    slug:           'active-directory-attacks',
    color:          'ROSE',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'PENETRATION_TESTING',
    estimatedHours: 12,
    isNew:          true,
    isFeatured:     true,
    tags:           ['active-directory', 'attacks', 'enumeration', 'kerberoasting', 'pass-the-hash', 'BloodHound'],
    skills:         ['Kerberoasting', 'Pass-the-Hash', 'BloodHound', 'AD Enumeration', 'DCSync', 'Golden Ticket'],
    ar_skills:      ['Kerberoasting', 'Pass-the-Hash', 'BloodHound', 'تعداد AD', 'DCSync', 'Golden Ticket'],
  },

  // ── 03 · Nmap - Network Discovery Mastery ───────────────────
  {
    jsonFile:       'Nmap - Network Discovery Mastery.json',
    slug:           'nmap-network-discovery',
    color:          'CYAN',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 8,
    isNew:          true,
    tags:           ['nmap', 'scanning', 'recon', 'network', 'port-scan', 'enumeration'],
    skills:         ['Nmap Scan Types', 'Service Detection', 'OS Fingerprinting', 'NSE Scripts', 'Firewall Evasion', 'Network Mapping'],
    ar_skills:      ['أنواع فحص Nmap', 'كشف الخدمات', 'OS Fingerprinting', 'سكريبتات NSE', 'تجاوز الجداران', 'خريطة الشبكة'],
  },

  // ── 04 · Wireshark - Packet Analysis Pro ────────────────────
  {
    jsonFile:       'Wireshark - Packet Analysis Pro.json',
    slug:           'wireshark-packet-analysis',
    color:          'CYAN',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 9,
    isNew:          true,
    tags:           ['wireshark', 'packet-analysis', 'traffic', 'forensics', 'network'],
    skills:         ['Packet Filtering', 'Protocol Dissection', 'Traffic Forensics', 'Credential Harvesting', 'Malware Traffic Analysis', 'Display Filters'],
    ar_skills:      ['تصفية الحزم', 'تحليل البروتوكول', 'جنائيات الحركة', 'حصاد بيانات الاعتماد', 'تحليل حركة المالور', 'فلاتير العرض'],
  },

  // ── 05 · Network Attacks & Exploitation ─────────────────────
  {
    jsonFile:       'Network Attacks & Exploitation.json',
    slug:           'network-attacks-and-exploitation',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'PENETRATION_TESTING',
    estimatedHours: 8,
    tags:           ['network-attacks', 'MITM', 'ARP', 'DNS-spoofing', 'exploitation', 'sniffing'],
    skills:         ['ARP Spoofing', 'MITM Attacks', 'DNS Spoofing', 'SSL Stripping', 'Network Sniffing', 'Lateral Movement'],
    ar_skills:      ['ARP Spoofing', 'هجمات MITM', 'DNS Spoofing', 'SSL Stripping', 'تجسس الشبكة', 'الحركة الجانبية'],
  },

  // ── 06 · Wireless Security & Attacks ────────────────────────
  {
    jsonFile:       'Wireless Security & Attacks.json',
    slug:           'wireless-security-and-attacks',
    color:          'VIOLET',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'PENETRATION_TESTING',
    estimatedHours: 7,
    tags:           ['wireless', 'WiFi', 'WPA2', 'WPA3', 'evil-twin', 'aircrack'],
    skills:         ['WPA2/WPA3 Cracking', 'Evil Twin Attack', 'Deauth Attacks', 'Aircrack-ng', 'Rogue AP', 'PMKID Attack'],
    ar_skills:      ['كسر WPA2/WPA3', 'هجوم Evil Twin', 'هجمات Deauth', 'Aircrack-ng', 'Rogue AP', 'هجوم PMKID'],
  },

  // ── 07 · OWASP Top 10 - Authentication & Authorization ──────────
  {
    jsonFile:       'OWASP Top 10 - Authentication & Authorization.json',
    slug:           'owasp-authentication-authorization',
    color:          'ROSE',
    difficulty:     'INTERMEDIATE',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 9,
    isNew:          true,
    isFeatured:     true,
    tags:           ['OWASP', 'authentication', 'authorization', 'broken-auth', 'IDOR', 'JWT'],
    skills:         ['Broken Authentication', 'IDOR', 'Privilege Escalation Web', 'JWT Attacks', 'OAuth Flaws', 'BOLA/BFLA'],
    ar_skills:      ['المصادقة المعطوبة', 'IDOR', 'رفع صلاحيات الويب', 'هجمات JWT', 'ثغرات OAuth', 'BOLA/BFLA'],
  },

  // ── 08 · OWASP Top 10 - XSS & CSRF ─────────────────────────
  {
    jsonFile:       'OWASP Top 10 - XSS & CSRF.json',
    slug:           'owasp-xss-csrf',
    color:          'ROSE',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 7,
    tags:           ['XSS', 'CSRF', 'OWASP', 'web-security', 'injection', 'stored-xss'],
    skills:         ['Reflected XSS', 'Stored XSS', 'DOM XSS', 'CSRF Exploitation', 'CSP Bypass', 'XSS to Account Takeover'],
    ar_skills:      ['Reflected XSS', 'Stored XSS', 'DOM XSS', 'استغلال CSRF', 'تجاوز CSP', 'XSS لاختطاف الحساب'],
  },

  // ── 09 · SQL Injection ──────────────────────────────────────────
  {
    jsonFile:       'SQL Injection.json',
    slug:           'sql-injection',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 8,
    isNew:          true,
    isFeatured:     true,
    tags:           ['SQLi', 'SQL-injection', 'database', 'blind-sqli', 'sqlmap', 'OWASP'],
    skills:         ['In-Band SQLi', 'Blind SQLi', 'Time-Based SQLi', 'sqlmap', 'SQLi to RCE', 'WAF Bypass'],
    ar_skills:      ['In-Band SQLi', 'Blind SQLi', 'Time-Based SQLi', 'sqlmap', 'SQLi إلى RCE', 'تجاوز WAF'],
  },

  // ── 10 · Metasploit Framework ─────────────────────────────────
  {
    jsonFile:       'Metasploit Framework - Exploitation Basics.json',
    slug:           'metasploit-framework',
    color:          'VIOLET',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'PENETRATION_TESTING',
    estimatedHours: 9,
    isNew:          true,
    tags:           ['metasploit', 'exploitation', 'msfconsole', 'meterpreter', 'payloads', 'post-exploitation'],
    skills:         ['msfconsole', 'Exploit Modules', 'Meterpreter', 'Payload Generation', 'Post-Exploitation', 'Persistence'],
    ar_skills:      ['msfconsole', 'موديولات الاستغلال', 'Meterpreter', 'توليد الحمولة', 'ما بعد الاختراق', 'الثبات'],
  },

  // ── 11 · Linux Privilege Escalation ───────────────────────────
  {
    jsonFile:       'Linux Privilege Escalation.json',
    slug:           'linux-privilege-escalation',
    color:          'EMERALD',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'PENETRATION_TESTING',
    estimatedHours: 11,
    isNew:          true,
    isFeatured:     true,
    tags:           ['privilege-escalation', 'linux', 'SUID', 'sudo', 'cron', 'capabilities'],
    skills:         ['SUID Exploitation', 'Sudo Misconfig', 'Cron Job Abuse', 'Capabilities Abuse', 'PATH Hijacking', 'Kernel Exploits'],
    ar_skills:      ['استغلال SUID', 'إساءة إعداد Sudo', 'إساءة استخدام Cron', 'إساءة استخدام Capabilities', 'PATH Hijacking', 'استغلال النواة'],
  },

  // ── 12 · Log Analysis & SIEM Basics ──────────────────────────
  {
    jsonFile:       'Log Analysis & SIEM Basics.json',
    slug:           'log-analysis-and-siem',
    color:          'CYAN',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 8,
    tags:           ['SIEM', 'log-analysis', 'splunk', 'elastic', 'SOC', 'incident-response'],
    skills:         ['Log Parsing', 'SIEM Rules', 'Splunk Basics', 'ELK Stack', 'Alert Triage', 'Threat Hunting'],
    ar_skills:      ['تحليل السجلات', 'قواعد SIEM', 'أساسيات Splunk', 'ELK Stack', 'تصنيف التنبيهات', 'Threat Hunting'],
  },

  // ── 13 · Malware Analysis - Introduction ─────────────────────
  {
    jsonFile:       'Malware Analysis - Introduction.json',
    slug:           'malware-analysis-introduction',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'MIXED',
    category:       'MALWARE_ANALYSIS',
    estimatedHours: 10,
    isNew:          true,
    tags:           ['malware', 'reverse-engineering', 'static-analysis', 'dynamic-analysis', 'sandbox'],
    skills:         ['Static Analysis', 'Dynamic Analysis', 'Sandbox Analysis', 'PE File Structure', 'YARA Rules', 'IOC Extraction'],
    ar_skills:      ['التحليل الساكن', 'التحليل الديناميكي', 'تحليل Sandbox', 'بنية ملف PE', 'قواعد YARA', 'استخراج IOC'],
  },

  // ── 14 · Digital Forensics Basics ─────────────────────────────
  {
    jsonFile:       'Digital Forensics Basics.json',
    slug:           'digital-forensics-basics',
    color:          'VIOLET',
    difficulty:     'INTERMEDIATE',
    access:         'PRO',
    contentType:    'MIXED',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 8,
    tags:           ['forensics', 'digital-forensics', 'incident-response', 'disk-forensics', 'memory-forensics'],
    skills:         ['Disk Imaging', 'Memory Forensics', 'File Recovery', 'Timeline Analysis', 'Volatility', 'Chain of Custody'],
    ar_skills:      ['نسخ القرص', 'تحليل الذاكرة', 'استعادة الملفات', 'تحليل الجداول الزمنية', 'Volatility', 'سلسلة الحضانة'],
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
  //  PATH 1 — Pre-Security  (✔️ already seeded — kept for upsert safety)
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
      { type: 'COURSE', slug: 'introduction-to-cybersecurity',      order: 1,  estimatedHours: 4  },
      { type: 'COURSE', slug: 'threats-and-risk-management',        order: 2,  estimatedHours: 4  },
      { type: 'COURSE', slug: 'security-frameworks-and-compliance', order: 3,  estimatedHours: 4  },
      { type: 'COURSE', slug: 'data-protection-and-privacy',        order: 4,  estimatedHours: 4  },
      { type: 'COURSE', slug: 'networking-basics-part-1',           order: 5,  estimatedHours: 5  },
      { type: 'COURSE', slug: 'networking-basics-part-2',           order: 6,  estimatedHours: 6  },
      { type: 'COURSE', slug: 'network-protocols',                  order: 7,  estimatedHours: 7  },
      { type: 'COURSE', slug: 'vpn-and-secure-communications',      order: 8,  estimatedHours: 4  },
      { type: 'COURSE', slug: 'network-analysis-and-monitoring',    order: 9,  estimatedHours: 8  },
      { type: 'COURSE', slug: 'linux-fundamentals-part-1',          order: 10, estimatedHours: 5  },
      { type: 'COURSE', slug: 'linux-fundamentals-part-2',          order: 11, estimatedHours: 6  },
      { type: 'COURSE', slug: 'linux-security-and-hardening',       order: 12, estimatedHours: 7  },
      { type: 'COURSE', slug: 'windows-fundamentals',               order: 13, estimatedHours: 5  },
      { type: 'COURSE', slug: 'windows-security',                   order: 14, estimatedHours: 7  },
      { type: 'COURSE', slug: 'bash-scripting',                     order: 15, estimatedHours: 5  },
      { type: 'COURSE', slug: 'python-for-security-basics',         order: 16, estimatedHours: 8  },
      { type: 'COURSE', slug: 'regular-expressions-for-security',   order: 17, estimatedHours: 4  },
      { type: 'COURSE', slug: 'how-the-web-works',                  order: 18, estimatedHours: 5  },
      { type: 'COURSE', slug: 'web-application-architecture',       order: 19, estimatedHours: 6  },
      { type: 'COURSE', slug: 'cookies-and-sessions',               order: 20, estimatedHours: 4  },
      { type: 'COURSE', slug: 'authentication-deep-dive',           order: 21, estimatedHours: 8  },
      { type: 'COURSE', slug: 'cryptography-fundamentals',          order: 22, estimatedHours: 6  },
      { type: 'COURSE', slug: 'building-your-security-lab',         order: 23, estimatedHours: 5  },
      { type: 'COURSE', slug: 'network-security-tools',             order: 24, estimatedHours: 7  },
      { type: 'COURSE', slug: 'threat-intelligence-and-osint',      order: 25, estimatedHours: 7  },
      { type: 'COURSE', slug: 'web-security-basics',                order: 26, estimatedHours: 9  },
      { type: 'COURSE', slug: 'careers-in-cybersecurity',           order: 27, estimatedHours: 3  },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 2 — Introduction to Cybersecurity
  //  Prerequisite: Pre-Security Path
  //  14 courses | INTERMEDIATE | ~123 hours total
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
      // ── PHASE 1: Recon & Scanning ─────────────────────────────────
      { type: 'COURSE', slug: 'nmap-network-discovery',           order: 1,  estimatedHours: 8,  isLocked: false },
      { type: 'COURSE', slug: 'wireshark-packet-analysis',        order: 2,  estimatedHours: 9,  isLocked: false },
      // ── PHASE 2: Network Attacks ────────────────────────────────
      { type: 'COURSE', slug: 'network-attacks-and-exploitation', order: 3,  estimatedHours: 8,  isLocked: false },
      { type: 'COURSE', slug: 'wireless-security-and-attacks',   order: 4,  estimatedHours: 7,  isLocked: false },
      // ── PHASE 3: Web Hacking ──────────────────────────────────
      { type: 'COURSE', slug: 'owasp-authentication-authorization', order: 5, estimatedHours: 9,  isLocked: false },
      { type: 'COURSE', slug: 'owasp-xss-csrf',                  order: 6,  estimatedHours: 7,  isLocked: false },
      { type: 'COURSE', slug: 'sql-injection',                   order: 7,  estimatedHours: 8,  isLocked: false },
      // ── PHASE 4: Exploitation ──────────────────────────────────
      { type: 'COURSE', slug: 'metasploit-framework',            order: 8,  estimatedHours: 9,  isLocked: false },
      { type: 'COURSE', slug: 'linux-privilege-escalation',      order: 9,  estimatedHours: 11, isLocked: false },
      // ── PHASE 5: Active Directory ──────────────────────────────
      { type: 'COURSE', slug: 'active-directory-fundamentals',   order: 10, estimatedHours: 7,  isLocked: false },
      { type: 'COURSE', slug: 'active-directory-attacks',        order: 11, estimatedHours: 12, isLocked: false },
      // ── PHASE 6: Blue Team ────────────────────────────────────
      { type: 'COURSE', slug: 'log-analysis-and-siem',           order: 12, estimatedHours: 8,  isLocked: false },
      { type: 'COURSE', slug: 'malware-analysis-introduction',   order: 13, estimatedHours: 10, isLocked: false },
      { type: 'COURSE', slug: 'digital-forensics-basics',        order: 14, estimatedHours: 8,  isLocked: false },
    ],
  },
];
