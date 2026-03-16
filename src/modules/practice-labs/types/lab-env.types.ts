// src/modules/practice-labs/types/lab-env.types.ts
//
// TypeScript types that mirror the new Prisma enums and metadata fields.
// Import these in services, controllers, and React components (via shared lib).

// ─── Environment type ─────────────────────────────────────────────────────────
// Maps 1-to-1 with the LabEnvironmentType Prisma enum.
// The frontend uses this to decide which React environment component to render.
export type LabEnvironmentType =
  | 'DEFAULT'          // existing labs — no change
  | 'BROWSER_SIM'      // xss, csrf, clickjacking, cookies
  | 'API_CONSOLE'      // jwt, api-hacking, some idor
  | 'BANKING_DASHBOARD'// business-logic, idor (accounts), race-condition
  | 'BLOG_CMS'         // stored-xss, file-upload, ssti, csrf
  | 'PORTAL_AUTH'      // broken-auth, captcha-bypass, path-traversal
  | 'ECOMMERCE'        // sqli (product search), race-condition (coupon)
  | 'SOCIAL_SIM'       // phishing, social-engineering
  | 'TERMINAL';        // command-injection, ssrf, future container labs

// ─── Hint penalty policy ──────────────────────────────────────────────────────
export type HintPenaltyMode =
  | 'PERCENTAGE'  // deduct % of reward at submission (new standard)
  | 'FIXED_XP';   // legacy: deduct XP immediately on unlock

// Standard penalty map for PERCENTAGE mode
export const HINT_PENALTY_MAP: Record<number, number> = {
  0: 0,    // no hints → full reward
  1: 10,   // hint 1   → -10%
  2: 30,   // hint 2   → -30%
  3: 60,   // hint 3   → -60%
  4: 90,   // solution → -90%
};

// ─── Flag policy ──────────────────────────────────────────────────────────────
export type FlagPolicyType =
  | 'PER_USER_PER_ATTEMPT'  // most secure — unique flag per attempt
  | 'PER_USER_PER_LAB'      // current default — one flag per user per lab
  | 'PER_SESSION'           // rotates on each launch
  | 'STATIC';               // same for everyone (legacy / ctf-style)

// ─── Structured dialog content ────────────────────────────────────────────────
// Used by MissionBriefDialog, LabInfoDialog, and ScenarioDialog components.

export interface MissionBriefContent {
  operativeCallsign: string;        // e.g. "Agent Alpha"
  classification: string;           // e.g. "TOP SECRET"
  objective: string;                // short mission objective
  targetSystem: string;             // e.g. "BrokenBank™ v2.1"
  context: string;                  // 2–3 sentence backstory
  successCriteria: string;          // what counts as mission success
  ar_objective?: string;
  ar_context?: string;
}

export interface LabInfoContent {
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  skillsTrained: string[];
  prerequisites: string[];
  toolsNeeded: string[];            // e.g. ["Browser DevTools", "Burp Suite"]
  vulnerabilityClass: string;       // e.g. "IDOR / Broken Object Level Auth"
  cvssScore?: number;               // optional CVSS 3.1 base score
  cweId?: string;                   // e.g. "CWE-639"
  ar_skillsTrained?: string[];
}

export interface ScenarioAdminContent {
  fullNarrative: string;            // complete scenario text (admin/instructor only)
  solutionWalkthrough: string[];    // step-by-step solution
  expectedFlag: string;             // plaintext flag (admin only — never sent to users)
  commonMistakes: string[];
  ar_fullNarrative?: string;
}

// ─── Immersive assets ─────────────────────────────────────────────────────────
// Generic structure for environment seed data stored in lab.immersiveAssets

export interface ImmersiveAssets {
  // Banking / IDOR
  accounts?: Array<{
    id: string;
    accountNo: string;
    ownerName: string;
    balance: number;
    role: string;
  }>;

  // Ecommerce
  products?: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    sku: string;
  }>;

  // Blog / CMS
  posts?: Array<{
    id: string;
    title: string;
    body: string;
    author: string;
    isPublic: boolean;
  }>;

  // Auth / Portal
  users?: Array<{
    username: string;
    role: string;
    hashedPassword?: string;
    isVictim?: boolean;
  }>;

  // Social / Phishing
  inbox?: Array<{
    from: string;
    subject: string;
    body: string;
    isPhishing: boolean;
  }>;

  // Generic key-value for edge cases
  [key: string]: unknown;
}

// ─── Lab metadata summary (returned by API) ───────────────────────────────────
export interface LabMetaSummary {
  id: string;
  slug: string;
  title: string;
  ar_title?: string;
  difficulty: string;
  category: string;
  environmentType: LabEnvironmentType;
  canonicalConceptId?: string;
  variantOfLabId?: string;
  targetRole?: string;
  hintPenaltyMode: HintPenaltyMode;
  flagPolicyType: FlagPolicyType;
  xpReward: number;
  pointsReward: number;
  duration?: number;
  skills: string[];
  hintCount: number;
}
