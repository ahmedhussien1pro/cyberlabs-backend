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
//  COURSES
// ═══════════════════════════════════════════════════════════════════
export const COURSES_META: CourseMeta[] = [
  // Add Courses Here
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
      // All Courses Here But Sort it
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
      // vpn-secure-communications ✅ VPN & Secure Communications.json
      // linux-fundamentals-part-1 ✅ Linux Fundamentals Part 1.json
      // linux-fundamentals-part-2 ✅ Linux Fundamentals Part 2.json
      // threats-and-risk-management
      // security-frameworks-and-compliance
      // careers-in-cybersecurity-from-soc-to-cloud
      // ad-attacks-enumeration
      // ctive-directory-fundamentals
      // owasp-authentication-authorization
      // owasp-xss-csrf
      // owasp-sql-injection21`
      // nmap-network-discovery-mastery
      // wireshark-packet-analysis
      // network-protocols
      // networking-basics-part-2
      // networking-basics-part-1
      // introduction-to-cybersecurity
    ],
  },
];
