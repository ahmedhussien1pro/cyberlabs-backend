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
  isComingSoon?: boolean;
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
  isComingSoon?: boolean;
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
//  COURSES
//  Section A : Pre-Security Path          (27 courses)
//  Section B : Introduction to Cybersecurity Path (14 courses)
//  Section C : Coming Soon courses        (10 courses)
// ═══════════════════════════════════════════════════════════════════
export const COURSES_META: CourseMeta[] = [

  // ════════════════════════════════════════════════════════════════
  //  SECTION A — Pre-Security Path (27 courses)
  // ════════════════════════════════════════════════════════════════

  // ── 01 · Careers in Cybersecurity ──────────────────────────────
  {
    jsonFile:       'Careers in Cybersecurity From SOC to Cloud-FINAL.json',
    slug:           'careers-in-cybersecurity',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'CAREER_AND_INDUSTRY',
    estimatedHours: 3,
    isNew:          true,
    isFeatured:     true,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/3fda5a7e-6de6-455d-bfae-947210076fec.webp',
    tags:           ['career', 'SOC', 'cloud', 'cybersecurity', 'roadmap', 'beginner'],
    skills:         ['Career Planning', 'SOC Roles', 'Cloud Security Careers', 'Cybersecurity Roadmap', 'Certifications Overview'],
    ar_skills:      ['تخطيط المسار الوظيفي', 'أدوار SOC', 'مسارات أمن السحابة', 'خارطة طريق الأمن السيبراني', 'نظرة عامة على الشهادات'],
  },

  // ── 02 · Introduction to Cybersecurity ─────────────────────────
  {
    jsonFile:       'Introduction to Cyber Security Fundamentals.json',
    slug:           'introduction-to-cybersecurity',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    isNew:          true,
    isFeatured:     true,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/7e5659ae-cf73-4295-8e0c-4526f47d3187.webp',
    tags:           ['beginner', 'fundamentals', 'cybersecurity', 'intro', 'CIA triad', 'security concepts'],
    skills:         ['CIA Triad', 'Security Concepts', 'Threat Types', 'Attack Vectors', 'Security Controls'],
    ar_skills:      ['ثالوث CIA', 'مفاهيم الأمن', 'أنواع التهديدات', 'ناقلات الهجوم', 'ضوابط الأمن'],
  },

  // ── 03 · Threats & Risk Management ─────────────────────────────
  {
    jsonFile:       'Threats & Risk Management.json',
    slug:           'threats-and-risk-management',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/d74aacea-948a-41ee-b470-21b5dc2dd4b6.webp',
    tags:           ['risk', 'threats', 'management', 'vulnerabilities', 'risk-assessment', 'beginner'],
    skills:         ['Risk Assessment', 'Threat Modeling', 'Vulnerability Management', 'Risk Mitigation', 'Security Policies'],
    ar_skills:      ['تقييم المخاطر', 'نمذجة التهديدات', 'إدارة الثغرات', 'تخفيف المخاطر', 'سياسات الأمن'],
  },

  // ── 04 · Security Frameworks & Compliance ──────────────────────
  {
    jsonFile:       'Security Frameworks & Compliance.json',
    slug:           'security-frameworks-and-compliance',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/c191f1ba-7645-44cf-9a0c-19b23397ccef.webp',
    tags:           ['NIST', 'ISO27001', 'compliance', 'frameworks', 'GDPR', 'PCI-DSS'],
    skills:         ['NIST Framework', 'ISO 27001', 'GDPR Basics', 'PCI-DSS', 'Security Auditing'],
    ar_skills:      ['إطار NIST', 'ISO 27001', 'أساسيات GDPR', 'PCI-DSS', 'تدقيق الأمن'],
  },

  // ── 05 · Data Protection & Privacy ─────────────────────────────
  {
    jsonFile:       'Data Protection & Privacy-f.json',
    slug:           'data-protection-and-privacy',
    color:          'ROSE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/f513cef7-049f-465f-8dbf-c956536b7e27.webp',
    tags:           ['data-protection', 'privacy', 'GDPR', 'encryption', 'compliance', 'PII'],
    skills:         ['Data Classification', 'Encryption Basics', 'GDPR Compliance', 'Privacy by Design', 'Data Loss Prevention'],
    ar_skills:      ['تصنيف البيانات', 'أساسيات التشفير', 'امتثال GDPR', 'الخصوصية بالتصميم', 'منع فقدان البيانات'],
  },

  // ── 06 · Networking Basics Part 1 ──────────────────────────────
  {
    jsonFile:       'Networking Basics Part 1 - V2.json',
    slug:           'networking-basics-part-1',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/41332709-81de-4732-9cac-24cf88a679f8.webp',
    tags:           ['networking', 'OSI', 'TCP/IP', 'LAN', 'WAN', 'beginner'],
    skills:         ['OSI Model', 'TCP/IP Stack', 'Network Topologies', 'Ethernet', 'MAC Addresses', 'ARP'],
    ar_skills:      ['نموذج OSI', 'مكدس TCP/IP', 'طوبولوجيا الشبكات', 'Ethernet', 'عناوين MAC', 'ARP'],
  },

  // ── 07 · Networking Basics Part 2 ──────────────────────────────
  {
    jsonFile:       'Networking Basics Part 2.json',
    slug:           'networking-basics-part-2',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 6,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/ed6d433d-00d3-42bf-84c5-41a72ffe58fe.webp',
    tags:           ['networking', 'IP', 'subnetting', 'DHCP', 'DNS', 'routing'],
    skills:         ['IP Addressing', 'Subnetting', 'DHCP', 'DNS', 'Routing Basics', 'NAT/PAT'],
    ar_skills:      ['عناوين IP', 'Subnetting', 'DHCP', 'DNS', 'أساسيات التوجيه', 'NAT/PAT'],
  },

  // ── 08 · Network Protocols ──────────────────────────────────────
  {
    jsonFile:       'Network Protocols.json',
    slug:           'network-protocols',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 7,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/de0074cd-5574-44de-ab60-63904f96c54e.webp',
    tags:           ['protocols', 'HTTP', 'FTP', 'SSH', 'SMTP', 'DNS', 'SNMP'],
    skills:         ['HTTP/HTTPS', 'FTP/SFTP', 'SSH Protocol', 'SMTP/IMAP', 'DNS Deep Dive', 'SNMP'],
    ar_skills:      ['HTTP/HTTPS', 'FTP/SFTP', 'بروتوكول SSH', 'SMTP/IMAP', 'DNS بعمق', 'SNMP'],
  },

  // ── 09 · Network Security Tools ─────────────────────────────────
  {
    jsonFile:       'Network Security Tools.json',
    slug:           'network-security-tools',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 7,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/3764f73c-78cd-4350-9cd3-b62b70c0521c.webp',
    tags:           ['tools', 'nmap', 'wireshark', 'netstat', 'tcpdump', 'network-security'],
    skills:         ['Nmap Basics', 'Wireshark Intro', 'Netstat', 'TCPdump', 'Nslookup/Dig', 'Traceroute'],
    ar_skills:      ['أساسيات Nmap', 'مقدمة Wireshark', 'Netstat', 'TCPdump', 'Nslookup/Dig', 'Traceroute'],
  },

  // ── 10 · Network Analysis & Monitoring ──────────────────────────
  {
    jsonFile:       'Network Analysis & Monitoring-f.json',
    slug:           'network-analysis-and-monitoring',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 8,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/4861a05d-9e39-43b2-bfe4-d5d1b6e29157.webp',
    tags:           ['monitoring', 'network-analysis', 'IDS', 'IPS', 'traffic-analysis', 'sniffing'],
    skills:         ['Traffic Analysis', 'IDS/IPS Basics', 'Network Baselining', 'Anomaly Detection', 'Packet Capture', 'Zeek Basics'],
    ar_skills:      ['تحليل الحركة', 'أساسيات IDS/IPS', 'خط أساس الشبكة', 'كشف الشذوذ', 'التقاط الحزم', 'أساسيات Zeek'],
  },

  // ── 11 · VPN & Secure Communications ────────────────────────────
  {
    jsonFile:       'VPN & Secure Communications.json',
    slug:           'vpn-and-secure-communications',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'NETWORK_SECURITY',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/e9b8dc56-bca6-4b7d-ae63-8e76d1e76b88.webp',
    tags:           ['VPN', 'TLS', 'IPsec', 'secure-comms', 'tunneling', 'encryption'],
    skills:         ['VPN Types', 'TLS/SSL', 'IPsec', 'OpenVPN', 'Tunneling Protocols', 'Zero Trust'],
    ar_skills:      ['أنواع VPN', 'TLS/SSL', 'IPsec', 'OpenVPN', 'بروتوكولات النفق', 'Zero Trust'],
  },

  // ── 12 · Linux Fundamentals Part 1 ──────────────────────────────
  {
    jsonFile:       'Linux Fundamentals Part 1.json',
    slug:           'linux-fundamentals-part-1',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/707ad027-7f76-47dc-95ff-cf9a34ca8715.webp',
    tags:           ['linux', 'beginner', 'terminal', 'commands', 'filesystem', 'bash'],
    skills:         ['Linux Terminal', 'File System Navigation', 'Basic Commands', 'File Permissions', 'Text Editors', 'Package Management'],
    ar_skills:      ['طرفية لينكس', 'التنقل في نظام الملفات', 'الأوامر الأساسية', 'صلاحيات الملفات', 'محررات النصوص', 'إدارة الحزم'],
  },

  // ── 13 · Linux Fundamentals Part 2 ──────────────────────────────
  {
    jsonFile:       'Linux Fundamentals Part 2.json',
    slug:           'linux-fundamentals-part-2',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 6,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/3378286a-ac01-4c43-9d19-eb1557b51ff1.webp',
    tags:           ['linux', 'permissions', 'users', 'processes', 'networking-linux', 'scripting'],
    skills:         ['User Management', 'Process Management', 'File Permissions Advanced', 'Cron Jobs', 'Linux Networking', 'Shell Scripting Intro'],
    ar_skills:      ['إدارة المستخدمين', 'إدارة العمليات', 'صلاحيات الملفات المتقدمة', 'Cron Jobs', 'شبكات لينكس', 'مقدمة Shell Scripting'],
  },

  // ── 14 · Bash Scripting ──────────────────────────────────────────
  {
    jsonFile:       'Bash Scripting-final.json',
    slug:           'bash-scripting',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/a8f4076d-c740-48f1-8df5-30ffff773c35.webp',
    tags:           ['bash', 'scripting', 'automation', 'shell', 'linux', 'security-automation'],
    skills:         ['Bash Variables', 'Conditionals & Loops', 'Functions', 'File Processing', 'Automation Scripts', 'Security Use Cases'],
    ar_skills:      ['متغيرات Bash', 'الشروط والحلقات', 'الدوال', 'معالجة الملفات', 'سكريبتات الأتمتة', 'حالات الاستخدام الأمنية'],
  },

  // ── 15 · Linux Security & Hardening ─────────────────────────────
  {
    jsonFile:       'Linux Security & Hardening.json',
    slug:           'linux-security-and-hardening',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 7,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/efeba495-81d5-4754-8825-2b2d2b780818.webp',
    tags:           ['linux', 'hardening', 'security', 'firewall', 'SELinux', 'AppArmor'],
    skills:         ['SSH Hardening', 'Firewall (iptables/ufw)', 'SELinux/AppArmor', 'Audit Logs', 'Fail2Ban', 'CIS Benchmarks'],
    ar_skills:      ['تقوية SSH', 'جدار الحماية (iptables/ufw)', 'SELinux/AppArmor', 'سجلات التدقيق', 'Fail2Ban', 'معايير CIS'],
  },

  // ── 16 · Windows Fundamentals ────────────────────────────────────
  {
    jsonFile:       'Windows Fundamentals.json',
    slug:           'windows-fundamentals',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/9cca84a4-ea95-45e9-87ca-7849dd7b9521.webp',
    tags:           ['windows', 'registry', 'processes', 'services', 'AD-basics', 'beginner'],
    skills:         ['Windows Architecture', 'Registry Basics', 'Processes & Services', 'Windows File System', 'User Accounts', 'Event Viewer'],
    ar_skills:      ['معمارية ويندوز', 'أساسيات الريجستري', 'العمليات والخدمات', 'نظام ملفات ويندوز', 'حسابات المستخدمين', 'عارض الأحداث'],
  },

  // ── 17 · Windows Security ────────────────────────────────────────
  {
    jsonFile:       'Windows Security.json',
    slug:           'windows-security',
    color:          'BLUE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'FUNDAMENTALS',
    estimatedHours: 7,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/5163f32a-4c3f-4ff0-a128-16b2d1e561b4.webp',
    tags:           ['windows', 'security', 'defender', 'hardening', 'GPO', 'NTLM'],
    skills:         ['Windows Defender', 'Group Policy (GPO)', 'NTLM/Kerberos Basics', 'BitLocker', 'Windows Firewall', 'Auditing & Logging'],
    ar_skills:      ['Windows Defender', 'سياسة المجموعة (GPO)', 'أساسيات NTLM/Kerberos', 'BitLocker', 'جدار حماية ويندوز', 'التدقيق والتسجيل'],
  },

  // ── 18 · Python for Security Basics ─────────────────────────────
  {
    jsonFile:       'Python for Security Basics-f.json',
    slug:           'python-for-security-basics',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 8,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/bd4aa7a5-d4c8-4711-a03c-fd8aac6be7e4.webp',
    tags:           ['python', 'scripting', 'security-automation', 'sockets', 'exploitation', 'beginner'],
    skills:         ['Python Basics', 'Socket Programming', 'File Manipulation', 'Web Requests', 'Security Scripting', 'Automation Tools'],
    ar_skills:      ['أساسيات Python', 'برمجة Sockets', 'معالجة الملفات', 'طلبات الويب', 'سكريبتينج الأمن', 'أدوات الأتمتة'],
  },

  // ── 19 · How the Web Works ───────────────────────────────────────
  {
    jsonFile:       'How the Web Works.json',
    slug:           'how-the-web-works',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/5c241705-9f1e-4a02-8b19-0bcd95a5d2a3.webp',
    tags:           ['web', 'HTTP', 'DNS', 'browsers', 'cookies', 'beginner'],
    skills:         ['HTTP Request/Response', 'DNS Resolution', 'Browser Internals', 'Cookies & Sessions', 'HTTPS/TLS', 'Web Architecture'],
    ar_skills:      ['طلب/استجابة HTTP', 'حل أسماء DNS', 'داخليات المتصفح', 'الكوكيز والجلسات', 'HTTPS/TLS', 'معمارية الويب'],
  },

  // ── 20 · Web Application Architecture ───────────────────────────
  {
    jsonFile:       'Web Application Architecture.json',
    slug:           'web-application-architecture',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 6,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/50f0f066-23d3-4831-8da1-d96fc172a933.webp',
    tags:           ['web-architecture', 'MVC', 'APIs', 'databases', 'frontend', 'backend'],
    skills:         ['Client-Server Model', 'REST APIs', 'MVC Architecture', 'Databases Basics', 'Load Balancers', 'CDN & Caching'],
    ar_skills:      ['نموذج Client-Server', 'REST APIs', 'معمارية MVC', 'أساسيات قواعد البيانات', 'موازنة التحميل', 'CDN والتخزين المؤقت'],
  },

  // ── 21 · Authentication Deep Dive ───────────────────────────────
  {
    jsonFile:       'Authentication Deep Dive.json',
    slug:           'authentication-deep-dive',
    color:          'ROSE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 8,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/eb5cfb80-99d0-42ce-b077-299361617d35.webp',
    tags:           ['authentication', 'OAuth', 'JWT', 'MFA', 'SSO', 'SAML'],
    skills:         ['Password Hashing', 'JWT Tokens', 'OAuth 2.0', 'MFA/2FA', 'SSO & SAML', 'Session Management'],
    ar_skills:      ['تشفير كلمات المرور', 'رموز JWT', 'OAuth 2.0', 'MFA/2FA', 'SSO و SAML', 'إدارة الجلسات'],
  },

  // ── 22 · Cookies & Sessions Lab ─────────────────────────────────
  {
    jsonFile:       'Cookies & Sessions Lab-final.json',
    slug:           'cookies-and-sessions',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/21d8f74a-8b35-4743-9bf2-9f9dfad7a770.webp',
    tags:           ['cookies', 'sessions', 'web-security', 'CSRF', 'XSS', 'session-hijacking'],
    skills:         ['Cookie Attributes', 'Session Fixation', 'Session Hijacking', 'Secure Cookie Flags', 'CSRF Tokens', 'LocalStorage vs Cookies'],
    ar_skills:      ['خصائص الكوكيز', 'تثبيت الجلسة', 'اختطاف الجلسة', 'علامات الكوكيز الآمنة', 'رموز CSRF', 'LocalStorage مقابل الكوكيز'],
  },

  // ── 23 · Web Security Basics ─────────────────────────────────────
  {
    jsonFile:       'Web Security Basics-f.json',
    slug:           'web-security-basics',
    color:          'ROSE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'WEB_SECURITY',
    estimatedHours: 9,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/632c8f90-ed4a-4fb7-a366-020fbbeb1428.webp',
    tags:           ['web-security', 'XSS', 'CSRF', 'SQLi', 'OWASP', 'beginner'],
    skills:         ['XSS Basics', 'CSRF Basics', 'SQL Injection Intro', 'Security Headers', 'HTTPS Importance', 'OWASP Top 10 Overview'],
    ar_skills:      ['أساسيات XSS', 'أساسيات CSRF', 'مقدمة SQL Injection', 'رؤوس الأمان', 'أهمية HTTPS', 'نظرة عامة OWASP Top 10'],
  },

  // ── 24 · Cryptography Fundamentals ──────────────────────────────
  {
    jsonFile:       'Cryptography Fundamentals-f.json',
    slug:           'cryptography-fundamentals',
    color:          'VIOLET',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'THEORETICAL',
    category:       'CRYPTOGRAPHY',
    estimatedHours: 6,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/899dc31d-a196-42bd-86eb-4efc700d5642.webp',
    tags:           ['cryptography', 'AES', 'RSA', 'hashing', 'PKI', 'TLS'],
    skills:         ['Symmetric Encryption', 'Asymmetric Encryption', 'Hashing Algorithms', 'PKI & Certificates', 'TLS Handshake', 'Digital Signatures'],
    ar_skills:      ['التشفير المتماثل', 'التشفير غير المتماثل', 'خوارزميات التجزئة', 'PKI والشهادات', 'مصافحة TLS', 'التوقيعات الرقمية'],
  },

  // ── 25 · Regular Expressions for Security ───────────────────────
  {
    jsonFile:       'Regular Expressions for Security-f.json',
    slug:           'regular-expressions-for-security',
    color:          'CYAN',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 4,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/532ac136-df26-453d-b9aa-c477ca1aad01.webp',
    tags:           ['regex', 'regular-expressions', 'log-analysis', 'pattern-matching', 'grep', 'security'],
    skills:         ['Regex Syntax', 'Pattern Matching', 'Log Parsing with Regex', 'Grep & Sed', 'SIEM Rule Writing', 'IOC Detection'],
    ar_skills:      ['صياغة Regex', 'مطابقة الأنماط', 'تحليل السجلات بـ Regex', 'Grep و Sed', 'كتابة قواعد SIEM', 'كشف IOC'],
  },

  // ── 26 · Building Your Security Lab ─────────────────────────────
  {
    jsonFile:       'Building Your Security Lab-f.json',
    slug:           'building-your-security-lab',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 5,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/b4c6ca78-e216-4e08-b817-620395b5baaf.webp',
    tags:           ['lab-setup', 'VirtualBox', 'VMware', 'Kali', 'home-lab', 'beginner'],
    skills:         ['VirtualBox/VMware', 'Kali Linux Setup', 'Network Segmentation', 'Vulnerable VMs', 'Lab Architecture', 'Snapshot Management'],
    ar_skills:      ['VirtualBox/VMware', 'إعداد Kali Linux', 'تقسيم الشبكة', 'الأجهزة الافتراضية الضعيفة', 'معمارية المختبر', 'إدارة اللقطات'],
  },

  // ── 27 · Threat Intelligence & OSINT ────────────────────────────
  {
    jsonFile:       'Threat Intelligence & OSINT-f.json',
    slug:           'threat-intelligence-and-osint',
    color:          'ORANGE',
    difficulty:     'BEGINNER',
    access:         'FREE',
    contentType:    'PRACTICAL',
    category:       'TOOLS_AND_TECHNIQUES',
    estimatedHours: 7,
    thumbnail:      'https://pub-cb38e65ea6bd411eb827a8641fdcc72d.r2.dev/admin/courses/e9dc7497-d695-4e52-9dcf-b8ffc18b8300.webp',
    tags:           ['OSINT', 'threat-intelligence', 'recon', 'Shodan', 'Maltego', 'CTI'],
    skills:         ['OSINT Techniques', 'Shodan', 'Maltego Basics', 'Threat Intel Platforms', 'Passive Recon', 'IOC Analysis'],
    ar_skills:      ['تقنيات OSINT', 'Shodan', 'أساسيات Maltego', 'منصات استخبارات التهديدات', 'الاستطلاع السلبي', 'تحليل IOC'],
  },

  // ════════════════════════════════════════════════════════════════
  //  SECTION B — Introduction to Cybersecurity Path (14 courses)
  // ════════════════════════════════════════════════════════════════

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

  // ── 03 · Nmap - Network Discovery Mastery ───────────────────────
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

  // ── 04 · Wireshark - Packet Analysis Pro ─────────────────────────
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

  // ── 05 · Network Attacks & Exploitation ──────────────────────────
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

  // ── 06 · Wireless Security & Attacks ─────────────────────────────
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

  // ── 08 · OWASP Top 10 - XSS & CSRF ──────────────────────────────
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

  // ── 09 · SQL Injection ───────────────────────────────────────────
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

  // ── 10 · Metasploit Framework ─────────────────────────────────────
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

  // ── 11 · Linux Privilege Escalation ──────────────────────────────
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

  // ── 12 · Log Analysis & SIEM Basics ──────────────────────────────
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

  // ── 13 · Malware Analysis - Introduction ─────────────────────────
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

  // ── 14 · Digital Forensics Basics ────────────────────────────────
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

  // ════════════════════════════════════════════════════════════════
  //  SECTION C — Coming Soon Courses (10 high-demand courses)
  //  isPublished: false | isComingSoon: true | jsonFile: ''
  // ════════════════════════════════════════════════════════════════

  // ── CS-01 · Burp Suite Mastery ────────────────────────────────
  {
    jsonFile:     '',
    slug:         'burp-suite-mastery',
    color:        'ORANGE',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'WEB_SECURITY',
    estimatedHours: 10,
    isComingSoon: true,
    tags:         ['burp-suite', 'web-security', 'proxy', 'scanning', 'intruder', 'repeater'],
    skills:       ['Burp Proxy', 'Burp Intruder', 'Burp Scanner', 'Burp Extensions', 'Intercept & Modify', 'Active Scanning'],
    ar_skills:    ['بروكسي Burp', 'متتحكم Burp', 'ماسح Burp', 'إضافات Burp', 'اعتراض وتعديل الطلبات', 'المسح النشط'],
  },

  // ── CS-02 · API Security & Hacking ───────────────────────────
  {
    jsonFile:     '',
    slug:         'api-security-and-hacking',
    color:        'VIOLET',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'WEB_SECURITY',
    estimatedHours: 10,
    isComingSoon: true,
    isNew:        true,
    tags:         ['API', 'REST', 'GraphQL', 'OWASP-API', 'JWT', 'broken-object-level'],
    skills:       ['OWASP API Top 10', 'BOLA/BFLA', 'Mass Assignment', 'GraphQL Injection', 'JWT Abuse', 'API Fuzzing'],
    ar_skills:    ['OWASP API Top 10', 'BOLA/BFLA', 'Mass Assignment', 'GraphQL Injection', 'إساءة استخدام JWT', 'API Fuzzing'],
  },

  // ── CS-03 · SSRF, XXE & Server-Side Attacks ─────────────────
  {
    jsonFile:     '',
    slug:         'ssrf-xxe-server-side-attacks',
    color:        'ROSE',
    difficulty:   'ADVANCED',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'WEB_SECURITY',
    estimatedHours: 9,
    isComingSoon: true,
    tags:         ['SSRF', 'XXE', 'server-side', 'blind-SSRF', 'XML', 'internal-network'],
    skills:       ['Blind SSRF', 'XXE to RCE', 'Cloud Metadata Abuse', 'SSRF Bypass', 'XXE OOB', 'SSRF Chaining'],
    ar_skills:    ['Blind SSRF', 'XXE إلى RCE', 'إساءة استخدام ميتاديتا السحابة', 'تجاوز SSRF', 'XXE OOB', 'تسلسل SSRF'],
  },

  // ── CS-04 · Cloud Security Fundamentals ─────────────────────
  {
    jsonFile:     '',
    slug:         'cloud-security-fundamentals',
    color:        'CYAN',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'MIXED',
    category:     'CLOUD_SECURITY',
    estimatedHours: 12,
    isComingSoon: true,
    isNew:        true,
    tags:         ['cloud', 'AWS', 'Azure', 'IAM', 'S3', 'cloud-security'],
    skills:       ['AWS IAM Misconfig', 'S3 Bucket Attacks', 'Azure AD Attacks', 'Cloud Enumeration', 'Privilege Escalation Cloud', 'Terraform Security'],
    ar_skills:    ['إساءة إعداد AWS IAM', 'هجمات S3 Bucket', 'هجمات Azure AD', 'تعداد السحابة', 'رفع صلاحيات السحابة', 'أمان Terraform'],
  },

  // ── CS-05 · Windows Privilege Escalation ────────────────────
  {
    jsonFile:     '',
    slug:         'windows-privilege-escalation',
    color:        'BLUE',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'PENETRATION_TESTING',
    estimatedHours: 10,
    isComingSoon: true,
    tags:         ['windows', 'privilege-escalation', 'token-impersonation', 'registry', 'services', 'UAC-bypass'],
    skills:       ['Token Impersonation', 'Registry Exploits', 'Weak Service Permissions', 'UAC Bypass', 'DLL Hijacking', 'AlwaysInstallElevated'],
    ar_skills:    ['انتحال Token', 'ثغرات الريجستري', 'صلاحيات خدمة ضعيفة', 'تجاوز UAC', 'DLL Hijacking', 'AlwaysInstallElevated'],
  },

  // ── CS-06 · Web Application Penetration Testing ─────────────
  {
    jsonFile:     '',
    slug:         'web-application-pentesting',
    color:        'ROSE',
    difficulty:   'ADVANCED',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'PENETRATION_TESTING',
    estimatedHours: 20,
    isComingSoon: true,
    isFeatured:   true,
    tags:         ['web-pentesting', 'OWASP', 'full-course', 'advanced', 'bug-bounty', 'recon'],
    skills:       ['Full Recon', 'Business Logic Vulns', 'File Upload Attacks', 'SSTI', 'Deserialization', 'OAuth Attacks', 'Race Conditions'],
    ar_skills:    ['استطلاع كامل', 'ثغرات المنطق التجاري', 'هجمات رفع الملفات', 'SSTI', 'إلغاء التسلسل', 'هجمات OAuth', 'ظروف السباق'],
  },

  // ── CS-07 · Docker & Container Security ─────────────────────
  {
    jsonFile:     '',
    slug:         'docker-container-security',
    color:        'CYAN',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'CLOUD_SECURITY',
    estimatedHours: 9,
    isComingSoon: true,
    tags:         ['docker', 'containers', 'kubernetes', 'escape', 'misconfig', 'DevSecOps'],
    skills:       ['Docker Escape', 'Container Misconfig', 'Kubernetes Attacks', 'Image Analysis', 'Secrets in Containers', 'DevSecOps Basics'],
    ar_skills:    ['هروب Docker', 'إساءة إعداد الحاويات', 'هجمات Kubernetes', 'تحليل الصور', 'الأسرار في الحاويات', 'أساسيات DevSecOps'],
  },

  // ── CS-08 · Reverse Engineering Basics ──────────────────────
  {
    jsonFile:     '',
    slug:         'reverse-engineering-basics',
    color:        'ORANGE',
    difficulty:   'ADVANCED',
    access:       'PRO',
    contentType:  'PRACTICAL',
    category:     'MALWARE_ANALYSIS',
    estimatedHours: 12,
    isComingSoon: true,
    tags:         ['reverse-engineering', 'assembly', 'ghidra', 'IDA', 'binary', 'crackme'],
    skills:       ['x86 Assembly', 'Ghidra', 'IDA Free', 'Binary Patching', 'Anti-Debug Bypass', 'CrackMe Challenges'],
    ar_skills:    ['تجميع x86', 'Ghidra', 'IDA Free', 'تعديل الباينري', 'تجاوز Anti-Debug', 'تحديات CrackMe'],
  },

  // ── CS-09 · Bug Bounty Hunting Methodology ───────────────────
  {
    jsonFile:     '',
    slug:         'bug-bounty-hunting-methodology',
    color:        'EMERALD',
    difficulty:   'INTERMEDIATE',
    access:       'PRO',
    contentType:  'MIXED',
    category:     'PENETRATION_TESTING',
    estimatedHours: 11,
    isComingSoon: true,
    isNew:        true,
    isFeatured:   true,
    tags:         ['bug-bounty', 'HackerOne', 'Bugcrowd', 'recon', 'methodology', 'report-writing'],
    skills:       ['Recon Automation', 'Subdomain Enumeration', 'Finding P1/P2 Bugs', 'Report Writing', 'Scope Analysis', 'Chaining Vulnerabilities'],
    ar_skills:    ['أتمتة الاستطلاع', 'تعداد النطاقات الفرعية', 'إيجاد ثغرات P1/P2', 'كتابة التقارير', 'تحليل النطاق', 'تسلسل الثغرات'],
  },

  // ── CS-10 · Incident Response & Threat Hunting ───────────────
  {
    jsonFile:     '',
    slug:         'incident-response-threat-hunting',
    color:        'BLUE',
    difficulty:   'ADVANCED',
    access:       'PRO',
    contentType:  'MIXED',
    category:     'TOOLS_AND_TECHNIQUES',
    estimatedHours: 12,
    isComingSoon: true,
    tags:         ['incident-response', 'threat-hunting', 'DFIR', 'forensics', 'SOC', 'playbooks'],
    skills:       ['IR Playbooks', 'Threat Hunting Sigma', 'Memory Analysis', 'Ransomware IR', 'SOC Automation', 'MITRE ATT&CK'],
    ar_skills:    ['كتيبات IR', 'Sigma Threat Hunting', 'تحليل الذاكرة', 'IR الفدية', 'أتمتة SOC', 'MITRE ATT&CK'],
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
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'pre-security',
    title:          'Pre-Security Path',
    ar_title:       'مسار ما قبل الأمن السيبراني',
    description:    'Build the foundational skills needed before diving into cybersecurity — Linux, Windows, networking, web basics, and scripting.',
    ar_description: 'طوّر المهارات الأساسية قبل الدخول في الأمن السيبراني — لينكس، ويندوز، الشبكات، أساسيات الويب، والسكريبتينج.',
    color:          'EMERALD',
    difficulty:     'BEGINNER',
    isNew:          true,
    isFeatured:     true,
    isPublished:    true,
    isComingSoon:   false,
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
    isComingSoon:   false,
    tags:           ['intermediate', 'network-security', 'web-hacking', 'active-directory', 'privilege-escalation', 'malware', 'forensics'],
    skills:         ['Nmap', 'Wireshark', 'Metasploit', 'Active Directory Attacks', 'Web Hacking', 'Privilege Escalation', 'Malware Analysis', 'SIEM'],
    ar_skills:      ['Nmap', 'Wireshark', 'Metasploit', 'هجمات AD', 'اختراق ويب', 'رفع صلاحيات', 'تحليل مالور', 'SIEM'],
    modules: [
      { type: 'COURSE', slug: 'nmap-network-discovery',             order: 1,  estimatedHours: 8  },
      { type: 'COURSE', slug: 'wireshark-packet-analysis',          order: 2,  estimatedHours: 9  },
      { type: 'COURSE', slug: 'network-attacks-and-exploitation',   order: 3,  estimatedHours: 8  },
      { type: 'COURSE', slug: 'wireless-security-and-attacks',      order: 4,  estimatedHours: 7  },
      { type: 'COURSE', slug: 'owasp-authentication-authorization', order: 5,  estimatedHours: 9  },
      { type: 'COURSE', slug: 'owasp-xss-csrf',                     order: 6,  estimatedHours: 7  },
      { type: 'COURSE', slug: 'sql-injection',                      order: 7,  estimatedHours: 8  },
      { type: 'COURSE', slug: 'metasploit-framework',               order: 8,  estimatedHours: 9  },
      { type: 'COURSE', slug: 'linux-privilege-escalation',         order: 9,  estimatedHours: 11 },
      { type: 'COURSE', slug: 'active-directory-fundamentals',      order: 10, estimatedHours: 7  },
      { type: 'COURSE', slug: 'active-directory-attacks',           order: 11, estimatedHours: 12 },
      { type: 'COURSE', slug: 'log-analysis-and-siem',              order: 12, estimatedHours: 8  },
      { type: 'COURSE', slug: 'malware-analysis-introduction',      order: 13, estimatedHours: 10 },
      { type: 'COURSE', slug: 'digital-forensics-basics',           order: 14, estimatedHours: 8  },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 3 — Web Application Penetration Testing  ⏳ COMING SOON
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'web-application-pentesting',
    title:          'Web Application Penetration Testing',
    ar_title:       'اختبار اختراق تطبيقات الويب',
    description:    'Master web application hacking from recon to full exploitation — Burp Suite, API attacks, SSRF, XXE, business logic, and bug bounty methodology.',
    ar_description: 'أتقن اختراق تطبيقات الويب من الاستطلاع حتى الاستغلال الكامل — Burp Suite، هجمات API، SSRF، XXE، منطق أعمال، ومنهجية Bug Bounty.',
    color:          'ROSE',
    difficulty:     'ADVANCED',
    isNew:          true,
    isFeatured:     true,
    isPublished:    false,
    isComingSoon:   true,
    tags:           ['web-pentesting', 'burp-suite', 'API', 'SSRF', 'XXE', 'bug-bounty', 'advanced'],
    skills:         ['Burp Suite Mastery', 'API Hacking', 'SSRF & XXE', 'Business Logic Vulns', 'Bug Bounty Methodology', 'Web App Full Recon'],
    ar_skills:      ['إتقان Burp Suite', 'اختراق API', 'SSRF & XXE', 'ثغرات المنطق التجاري', 'منهجية Bug Bounty', 'استطلاع كامل'],
    modules: [
      { type: 'COURSE', slug: 'burp-suite-mastery',             order: 1, estimatedHours: 10, isLocked: true },
      { type: 'COURSE', slug: 'api-security-and-hacking',       order: 2, estimatedHours: 10, isLocked: true },
      { type: 'COURSE', slug: 'ssrf-xxe-server-side-attacks',   order: 3, estimatedHours: 9,  isLocked: true },
      { type: 'COURSE', slug: 'web-application-pentesting',     order: 4, estimatedHours: 20, isLocked: true },
      { type: 'COURSE', slug: 'bug-bounty-hunting-methodology', order: 5, estimatedHours: 11, isLocked: true },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 4 — SOC Analyst Path  ⏳ COMING SOON
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'soc-analyst',
    title:          'SOC Analyst Path',
    ar_title:       'مسار محلل مركز عمليات الأمن',
    description:    'Become a job-ready SOC Analyst — master log analysis, SIEM, threat hunting, phishing analysis, and incident response workflows.',
    ar_description: 'كن محلل SOC جاهزًا لسوق العمل — أتقن تحليل السجلات، SIEM، التحقيق في التهديدات، تحليل التصيد الالكتروني، وسير عمل الاستجابة للحوادث.',
    color:          'ORANGE',
    difficulty:     'INTERMEDIATE',
    isNew:          true,
    isFeatured:     true,
    isPublished:    false,
    isComingSoon:   true,
    tags:           ['SOC', 'blue-team', 'SIEM', 'threat-hunting', 'incident-response', 'log-analysis'],
    skills:         ['SIEM & Log Analysis', 'Threat Hunting', 'Incident Response', 'Phishing Analysis', 'SOC Automation', 'MITRE ATT&CK'],
    ar_skills:      ['تحليل سجلات SIEM', 'Threat Hunting', 'الاستجابة للحوادث', 'تحليل التصيد', 'أتمتة SOC', 'MITRE ATT&CK'],
    modules: [
      { type: 'COURSE', slug: 'log-analysis-and-siem',            order: 1, estimatedHours: 8,  isLocked: true },
      { type: 'COURSE', slug: 'malware-analysis-introduction',    order: 2, estimatedHours: 10, isLocked: true },
      { type: 'COURSE', slug: 'digital-forensics-basics',         order: 3, estimatedHours: 8,  isLocked: true },
      { type: 'COURSE', slug: 'incident-response-threat-hunting', order: 4, estimatedHours: 12, isLocked: true },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATH 5 — Cloud Security Path  ⏳ COMING SOON
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    slug:           'cloud-security',
    title:          'Cloud Security Path',
    ar_title:       'مسار أمن السحابة',
    description:    'Learn how to attack and defend cloud environments — AWS, Azure, IAM misconfigurations, S3 attacks, container security, and cloud pentesting.',
    ar_description: 'تعلّم كيف تهاجم بيئات السحابة وتدافع عنها — AWS، Azure، إساءة إعداد IAM، هجمات S3، أمن الحاويات، واختبار اختراق السحابة.',
    color:          'CYAN',
    difficulty:     'ADVANCED',
    isNew:          true,
    isFeatured:     false,
    isPublished:    false,
    isComingSoon:   true,
    tags:           ['cloud', 'AWS', 'Azure', 'IAM', 'containers', 'kubernetes', 'DevSecOps'],
    skills:         ['AWS Security', 'Azure Security', 'IAM Attacks', 'Container Security', 'Cloud Pentesting', 'DevSecOps'],
    ar_skills:      ['أمن AWS', 'أمن Azure', 'هجمات IAM', 'أمن الحاويات', 'اختبار اختراق السحابة', 'DevSecOps'],
    modules: [
      { type: 'COURSE', slug: 'cloud-security-fundamentals',      order: 1, estimatedHours: 12, isLocked: true },
      { type: 'COURSE', slug: 'docker-container-security',        order: 2, estimatedHours: 9,  isLocked: true },
      { type: 'COURSE', slug: 'windows-privilege-escalation',     order: 3, estimatedHours: 10, isLocked: true },
      { type: 'COURSE', slug: 'incident-response-threat-hunting', order: 4, estimatedHours: 12, isLocked: true },
    ],
  },
];
