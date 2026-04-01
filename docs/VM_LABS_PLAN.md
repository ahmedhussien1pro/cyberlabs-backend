# 🧠 Scalable VM Labs — Full Implementation Plan

> **Role:** Senior Platform Architect + Backend Engineer  
> **Target Repo:** `cyberlabs-backend`  
> **Branch:** `main` (all commits go directly to main)  
> **Status Legend:** ☐ Not started · ✅ Done · 🔄 In Progress · ⏸ Blocked  

---

## 🎯 Vision

Build a **fully isolated, per-user VM lab system** that runs Docker-based environments (Kali Linux, Ubuntu, custom vuln boxes) on DigitalOcean, accessible via browser (noVNC), completely decoupled from the existing `practice-labs` module, and integrated with the existing users, scoring, hints, progress, and notifications systems — without touching any existing working code.

This is **not a prototype**. It is a production-grade, scalable module designed to grow from 5 concurrent VMs today to 500+ with zero architectural changes.

---

## 🔒 Strict Rules (MUST Be Followed At All Times)

1. **NEVER modify, delete, or rename** any existing file, model, enum, relation, or service that is already live.
2. **NEVER skip a step** — execute phases in exact order. If a step is blocked, mark it ⏸ and report why before moving on.
3. **ALL commits go to `main` branch only** — no feature branches.
4. **Each commit must do exactly one thing** — one file, one concern. No bulk commits.
5. **Before any Prisma migration**, validate the schema compiles with `npx prisma validate` — never run `prisma migrate` without confirmation.
6. **Never generate a flag, token, or secret in the frontend** — all sensitive values are server-generated, server-validated only.
7. **Every new endpoint must use the existing `JwtAuthGuard`** — no unprotected VM routes.
8. **No hardcoded credentials, IPs, or tokens** anywhere in code — all come from environment variables.
9. **Do not register `VmLabsModule` in `app.module.ts` until Step 5 is fully complete** — keep module isolated during build.
10. **Every scenario in Section 4 must have a corresponding guard, cron, or validation implemented** — not just noted.

---

## ✅ Goal & Acceptance Criteria

### Overall Goal
A student can open a VM-based lab, get a browser VNC session to a live Docker container (Kali/Ubuntu), solve CTF-style challenges, submit flags, and receive XP/score — all through the existing CyberLabs platform UI.

### Acceptance Criteria Checklist
- [ ] A `VmLabTemplate` can be seeded and retrieved via API
- [ ] A student can start a VM lab and receive a working VNC URL
- [ ] Two students starting the same lab get completely isolated environments
- [ ] A student's VM expires automatically after the configured duration
- [ ] Expiry warning is sent via the existing notifications module
- [ ] A flag submission validates server-side only, with rate limiting
- [ ] Score penalty is applied correctly when hints are used
- [ ] Admin can list all running instances and forcefully terminate any
- [ ] Pool capacity is respected — queue activates when pool is full
- [ ] Zero changes to `practice-labs`, `labs`, `courses`, or any existing module
- [ ] `npx prisma validate` passes with zero errors after schema additions
- [ ] All new endpoints return structured errors matching existing API format

---

## 📦 Reference Sources

| Source | What We Take From It | Link |
|--------|---------------------|------|
| CyberRanger | YAML scenario schema → `VmLabTemplate.config`, noVNC entrypoint pattern, FastAPI VM state machine logic | https://github.com/Slayingripper/CyberRanger |
| CyberRanger entrypoint | `entrypoint.sh` Kali+xfce4+noVNC startup script | https://github.com/Slayingripper/CyberRanger/blob/main/docker/kali/entrypoint.sh |
| CyberRanger VM states | State machine: CREATING → RUNNING → STOPPED → TERMINATED | https://github.com/Slayingripper/CyberRanger/blob/main/backend/app/services/vm_service.py |
| 2dukes Framework | `challenge_vars.yml` → `VmLabTemplate.envVars`, Docker network isolation architecture | https://github.com/2dukes/Cyber-Range-Framework |
| 2dukes entrypoint | Kali VNC server startup: `vncserver :1 + novnc_proxy` | https://github.com/2dukes/Cyber-Range-Framework/blob/main/scenarios/kali/entrypoint.sh |
| 2dukes scenarios | Log4j, Ransomware, DiceCTF (22 scenarios) — first lab content to package as Docker images | https://github.com/2dukes/Cyber-Range-Framework/tree/main/scenarios |
| 2dukes networking | Internal + DMZ + External network layers, Firewall rules between networks | https://github.com/2dukes/Cyber-Range-Framework/blob/main/README.md#architecture |

---

## 🗂️ Module File Structure (Final Target)

```
src/modules/vm-labs/
├── vm-labs.module.ts                  ← NestJS module definition
├── vm-labs.controller.ts              ← HTTP REST endpoints
├── vm-labs.service.ts                 ← Business logic orchestrator
├── vm-orchestrator.service.ts         ← DigitalOcean Droplet/Docker API calls
├── vm-session.service.ts              ← VNC token generation & validation
├── vm-pool.service.ts                 ← Pool management + queue logic
├── vm-cleanup.cron.ts                 ← Expiry + dead instance cleanup
├── vm-flag.service.ts                 ← Flag generation & validation
├── vm-hint.service.ts                 ← Hint unlock + penalty calculation
├── vm-admin.controller.ts             ← Admin-only instance management
└── dto/
    ├── start-vm-lab.dto.ts
    ├── vm-lab-card.dto.ts
    ├── submit-flag.dto.ts
    ├── extend-session.dto.ts
    └── admin-list-instances.dto.ts

prisma/
└── schema.prisma                      ← Additive-only changes (see Step 2)

docs/
└── VM_LABS_PLAN.md                    ← This file
```

---

## 🧱 Existing Modules We Integrate With (Read-Only)

> These modules are **never modified**. We call their services as dependencies.

| Module | What We Use | How |
|--------|-------------|-----|
| `users` | `User` model, `userId` FK | Prisma relation |
| `auth` | `JwtAuthGuard`, `CurrentUser` decorator | Import guard |
| `labs` (practice-labs) | `Lab` model for `vmLabTemplateId` FK | Optional FK only — Lab model untouched |
| `notifications` | `NotificationsService.send()` | Inject & call |
| `progress` | `UserLabProgress` update on completion | Inject & call |
| `tracking` | Add `VM_LAB_STARTED`, `VM_LAB_COMPLETED` events | Add to existing enum only |
| `gamification` | XP award, Points award after flag submission | Inject & call existing service |
| `LabFlagRecord` | Existing model — add `vmInstanceId` as optional FK | Additive migration only |
| `LabSubmission` | Existing model — add `vmInstanceId` as optional FK | Additive migration only |

---

## 🗄️ Step 1 — Schema Design Review & Approval

**Goal:** Define all new Prisma models before writing a single line of NestJS code.  
**Status:** ☐  

### New Enums (additive only)

```prisma
enum VmInstanceStatus {
  QUEUED       // waiting for pool slot
  PROVISIONING // container being created
  STARTING     // VNC server initializing
  RUNNING      // ready for student
  PAUSED       // student disconnected, keepalive grace
  STOPPING     // graceful shutdown in progress
  STOPPED      // terminated, resources freed
  ERROR        // crashed or health check failed
  EXPIRED      // TTL exceeded, auto-terminated
}

enum VmProviderType {
  DOCKER_LOCAL     // development: local docker socket
  DIGITAL_OCEAN    // production: DO Droplets or DOKS pods
  CUSTOM           // future: any provider via adapter interface
}

enum VmOsType {
  KALI_LINUX
  UBUNTU_22
  UBUNTU_20
  WINDOWS_SERVER  // future
  CUSTOM
}

enum VmNetworkMode {
  ISOLATED        // no internet, internal only (default)
  LIMITED_EGRESS  // whitelist-only outbound (e.g., for HTTP labs)
  FULL_EGRESS     // unrestricted (special cases only, admin-approved)
}

enum VmLabEventType {
  INSTANCE_CREATED
  INSTANCE_STARTED
  INSTANCE_STOPPED
  INSTANCE_EXPIRED
  INSTANCE_ERROR
  FLAG_SUBMITTED_CORRECT
  FLAG_SUBMITTED_WRONG
  HINT_UNLOCKED
  SESSION_EXTENDED
  ADMIN_TERMINATED
  HEALTH_CHECK_FAILED
  VNC_CONNECTED
  VNC_DISCONNECTED
}
```

### New Models (additive only)

```prisma
// ─── VM Lab Template ──────────────────────────────────────────────────────────
// Defines a reusable lab environment specification.
// Inspired by CyberRanger scenario.yaml + 2dukes challenge_vars.yml
model VmLabTemplate {
  id              String         @id @default(uuid())
  slug            String         @unique
  title           String
  ar_title        String?
  description     String?        @db.Text
  ar_description  String?        @db.Text

  // Docker image to run (e.g., "cyberlabs/kali-log4j:latest")
  dockerImage     String
  osType          VmOsType       @default(KALI_LINUX)

  // Resource limits per instance
  cpuLimit        Float          @default(1.0)   // cores
  ramLimitMb      Int            @default(1024)  // MB
  diskLimitGb     Int            @default(10)    // GB

  // Network
  networkMode     VmNetworkMode  @default(ISOLATED)
  exposedPorts    Json           @default("[]")  // [{ "containerPort": 6080, "label": "VNC" }]

  // Environment variables injected at container start
  // Format: { "FLAG": "auto-generated", "TARGET_IP": "10.0.0.5" }
  // "FLAG" value = "auto-generated" → system generates unique flag per instance
  envVarTemplate  Json           @default("{}")

  // Lab scenario config (from CyberRanger YAML concept)
  // Stores: scenario description, objectives, network topology
  scenarioConfig  Json           @default("{}")

  // Pool settings
  poolSize        Int            @default(5)     // max concurrent instances allowed
  instanceTtlMin  Int            @default(120)   // default session length in minutes
  maxTtlMin       Int            @default(240)   // max after extensions
  extensionMin    Int            @default(30)    // minutes added per extension

  // Scoring
  maxScore        Int            @default(100)
  flagPolicyType  FlagPolicyType @default(PER_USER_PER_ATTEMPT)

  // Linking to existing Lab model (optional — practice-lab counterpart)
  labId           String?
  lab             Lab?           @relation(fields: [labId], references: [id], onDelete: SetNull)

  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  instances       VmLabInstance[]
  pool            VmLabPool?

  @@index([slug])
  @@index([isActive])
  @@map("vm_lab_templates")
}

// ─── VM Lab Pool ──────────────────────────────────────────────────────────────
// Tracks real-time capacity for a given template.
model VmLabPool {
  id                String         @id @default(uuid())
  templateId        String         @unique
  template          VmLabTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)

  maxSize           Int            @default(5)
  activeCount       Int            @default(0)   // updated by cron
  queuedCount       Int            @default(0)   // users waiting
  provider          VmProviderType @default(DOCKER_LOCAL)

  // DigitalOcean region if provider = DIGITAL_OCEAN
  region            String?        // e.g. "fra1", "nyc1"

  updatedAt         DateTime       @updatedAt

  @@map("vm_lab_pools")
}

// ─── VM Lab Instance ─────────────────────────────────────────────────────────
// One live container per user per attempt. Completely isolated.
model VmLabInstance {
  id              String              @id @default(uuid())
  templateId      String
  template        VmLabTemplate       @relation(fields: [templateId], references: [id], onDelete: Restrict)
  userId          String
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  status          VmInstanceStatus    @default(QUEUED)

  // Provider-specific identifiers
  containerId     String?             // Docker container ID or DO Droplet ID
  containerIp     String?             // Internal IP of the container

  // VNC access (served via noVNC proxy)
  vncPort         Int?                // internal VNC port (5901)
  vncProxyPort    Int?                // external noVNC port (6080+)
  vncProxyHost    String?             // hostname of the proxy (e.g., vnc.cyberlabs.com)

  // Flag for this specific instance (server-generated, per CyberRanger pattern)
  flag            String?             // hashed — compared on submission
  flagSubmitted   Boolean             @default(false)
  flagSubmittedAt DateTime?

  // Scoring
  finalScore      Int?
  hintsUsed       Int                 @default(0)
  scoreDeduction  Int                 @default(0)

  // Lifecycle timestamps
  queuedAt        DateTime            @default(now())
  startedAt       DateTime?
  expiresAt       DateTime?           // set when status → RUNNING
  stoppedAt       DateTime?

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  sessions        VmLabSession[]
  events          VmLabEvent[]
  hintUsages      VmLabHintUsage[]

  @@unique([userId, templateId, createdAt]) // allows multiple attempts over time
  @@index([userId])
  @@index([templateId])
  @@index([status])
  @@index([expiresAt])
  @@map("vm_lab_instances")
}

// ─── VM Lab Session ───────────────────────────────────────────────────────────
// Tracks a student's active browser connection to a VM.
// Inspired by CyberRanger's per-session VNC token approach.
model VmLabSession {
  id              String         @id @default(uuid())
  instanceId      String
  instance        VmLabInstance  @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  userId          String

  // One-time VNC access token (short-lived, tied to userId+instanceId)
  vncToken        String         @unique @default(uuid())
  vncTokenExpiresAt DateTime

  // noVNC URL returned to frontend
  // Format: https://vnc.cyberlabs.com/{instanceId}?token={vncToken}
  accessUrl       String?

  // Heartbeat tracking
  lastHeartbeatAt DateTime?
  disconnectedAt  DateTime?
  isActive        Boolean        @default(true)

  userAgent       String?
  ip              String?

  createdAt       DateTime       @default(now())

  @@index([instanceId])
  @@index([userId])
  @@index([vncToken])
  @@index([isActive])
  @@map("vm_lab_sessions")
}

// ─── VM Lab Hint Usage ────────────────────────────────────────────────────────
// Tracks hint usage per instance (separate from existing LabHintUsage)
model VmLabHintUsage {
  id          String         @id @default(uuid())
  instanceId  String
  instance    VmLabInstance  @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  userId      String
  hintIndex   Int            // 0-based hint number
  penalty     Int            // score points deducted
  unlockedAt  DateTime       @default(now())

  @@unique([instanceId, hintIndex])
  @@index([instanceId])
  @@index([userId])
  @@map("vm_lab_hint_usages")
}

// ─── VM Lab Event ─────────────────────────────────────────────────────────────
// Full audit log for every significant action on an instance.
model VmLabEvent {
  id          String           @id @default(uuid())
  instanceId  String
  instance    VmLabInstance    @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  userId      String?
  eventType   VmLabEventType
  meta        Json?            // additional context (e.g., wrong flag value hash, admin id)
  ip          String?
  userAgent   String?
  createdAt   DateTime         @default(now())

  @@index([instanceId])
  @@index([eventType])
  @@index([createdAt])
  @@map("vm_lab_events")
}
```

### Additive Changes to Existing Models

```prisma
// Add to existing Lab model (no deletions, no renames):
model Lab {
  // ... all existing fields unchanged ...
  vmLabTemplates  VmLabTemplate[]   // new reverse relation
}

// Add to existing LabSubmission model:
model LabSubmission {
  // ... all existing fields unchanged ...
  vmInstanceId    String?           // new optional FK
  vmInstance      VmLabInstance?    @relation(fields: [vmInstanceId], references: [id], onDelete: SetNull)
}

// Add to existing User model:
model User {
  // ... all existing fields unchanged ...
  vmLabInstances  VmLabInstance[]   // new reverse relation
}
```

### Acceptance Criteria — Step 1
- [ ] All new models written in schema.prisma below the existing models
- [ ] `npx prisma validate` passes with zero errors
- [ ] No existing model, enum, field, or relation was modified or removed
- [ ] PR review shows only additive diff in schema.prisma

---

## ⚙️ Step 2 — Prisma Migration

**Goal:** Apply the new schema to the database without affecting existing tables.  
**Status:** ☐  
**Pre-condition:** Step 1 acceptance criteria all checked ✅  

### Steps
1. Run `npx prisma validate` — must pass with zero errors
2. Run `npx prisma migrate dev --name add_vm_labs_module` on dev DB
3. Verify migration SQL: only `CREATE TABLE` and `ALTER TABLE ... ADD COLUMN` statements — **no `DROP`, no `ALTER ... DROP COLUMN`, no `RENAME`**
4. Run `npx prisma generate` to update the Prisma client
5. Run existing test suite — zero regressions allowed

### Acceptance Criteria — Step 2
- [ ] Migration file contains zero `DROP` statements
- [ ] All 5 new tables appear in the database
- [ ] Existing tables are structurally identical to pre-migration
- [ ] `npx prisma generate` succeeds
- [ ] All existing API routes return identical responses post-migration

---

## 🏗️ Step 3 — Module Scaffold (Structure Only, No Logic)

**Goal:** Create the file structure for `vm-labs` module — no business logic yet.  
**Status:** ☐  
**Pre-condition:** Step 2 acceptance criteria all checked ✅  

### Files to Create

| File | Content |
|------|---------|
| `src/modules/vm-labs/vm-labs.module.ts` | NestJS module shell, imports PrismaModule |
| `src/modules/vm-labs/vm-labs.controller.ts` | Empty controller with route stubs + JwtAuthGuard |
| `src/modules/vm-labs/vm-labs.service.ts` | Empty service, inject PrismaService |
| `src/modules/vm-labs/vm-orchestrator.service.ts` | Empty service, inject ConfigService |
| `src/modules/vm-labs/vm-session.service.ts` | Empty service |
| `src/modules/vm-labs/vm-pool.service.ts` | Empty service |
| `src/modules/vm-labs/vm-cleanup.cron.ts` | Empty cron, import `@nestjs/schedule` |
| `src/modules/vm-labs/vm-flag.service.ts` | Empty service |
| `src/modules/vm-labs/vm-hint.service.ts` | Empty service |
| `src/modules/vm-labs/vm-admin.controller.ts` | Empty controller + RolesGuard(ADMIN) |
| `src/modules/vm-labs/dto/start-vm-lab.dto.ts` | Empty DTO shell |
| `src/modules/vm-labs/dto/vm-lab-card.dto.ts` | Empty DTO shell |
| `src/modules/vm-labs/dto/submit-flag.dto.ts` | Empty DTO shell |
| `src/modules/vm-labs/dto/extend-session.dto.ts` | Empty DTO shell |
| `src/modules/vm-labs/dto/admin-list-instances.dto.ts` | Empty DTO shell |

> ⚠️ Do NOT register VmLabsModule in `app.module.ts` yet.

### Acceptance Criteria — Step 3
- [ ] All files exist with correct NestJS decorators
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] No existing file was modified
- [ ] Module is NOT yet registered in app.module.ts

---

## 🔌 Step 4 — DTO Definitions

**Goal:** Define all input/output shapes before implementing any logic.  
**Status:** ☐  
**Pre-condition:** Step 3 acceptance criteria all checked ✅  

### `VmLabCardDTO` (response sent to frontend for Lab Card)

```typescript
export class VmLabCardDTO {
  // From existing Lab model
  labId: string;
  labSlug: string;
  title: string;
  ar_title?: string;
  description?: string;
  difficulty: Difficulty;
  category: CATEGORY;
  xpReward: number;
  estimatedDurationMin: number;

  // From VmLabTemplate
  templateId: string;
  osType: VmOsType;
  networkMode: VmNetworkMode;
  toolsIncluded: string[];        // parsed from scenarioConfig
  networkTopology: object;        // parsed from scenarioConfig

  // Real-time pool status
  poolStatus: 'AVAILABLE' | 'QUEUED' | 'AT_CAPACITY';
  availableSlots: number;
  estimatedWaitMin: number | null; // null if AVAILABLE

  // Per-user state (null if user has no active instance)
  userInstanceStatus: VmInstanceStatus | null;
  userInstanceId: string | null;
  userInstanceExpiresAt: string | null;  // ISO timestamp
  userProgress: number | null;           // 0-100
  userFlagSubmitted: boolean;
}
```

### `StartVmLabDTO` (request body for POST /vm-labs/:templateSlug/start)

```typescript
export class StartVmLabDTO {
  // No body required — templateSlug from URL param, userId from JWT
}
```

### `SubmitFlagDTO` (request body for POST /vm-labs/instances/:instanceId/submit-flag)

```typescript
export class SubmitFlagDTO {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  flag: string;
}
```

### `ExtendSessionDTO`

```typescript
export class ExtendSessionDTO {
  // No body required — extension is fixed to template.extensionMin
}
```

### `AdminListInstancesDTO` (query params)

```typescript
export class AdminListInstancesDTO {
  @IsOptional() status?: VmInstanceStatus;
  @IsOptional() templateId?: string;
  @IsOptional() userId?: string;
  @IsOptional() @IsInt() page?: number;
  @IsOptional() @IsInt() limit?: number;
}
```

### Acceptance Criteria — Step 4
- [ ] All DTOs use class-validator decorators
- [ ] All DTOs have corresponding Swagger `@ApiProperty` decorators
- [ ] TypeScript compiles with zero errors

---

## 🔁 Step 5 — State Machine & Core Logic

**Goal:** Implement VM lifecycle state machine and core business logic.  
**Status:** ☐  
**Pre-condition:** Step 4 acceptance criteria all checked ✅  

### State Machine (Inspired by CyberRanger vm_service.py)

Reference: https://github.com/Slayingripper/CyberRanger/blob/main/backend/app/services/vm_service.py

```
QUEUED
  └──[pool slot available]──► PROVISIONING
       └──[container started]──► STARTING
            └──[VNC ready]──► RUNNING
                 ├──[TTL exceeded]──► EXPIRED ──► STOPPED
                 ├──[user stops]──► STOPPING ──► STOPPED
                 ├──[health check fails 3x]──► ERROR ──► STOPPED
                 └──[admin terminates]──► STOPPED
```

### `VmPoolService` — Pool Management

```
Logic:
1. getAvailableSlot(templateId):
   - Count RUNNING + PROVISIONING + STARTING instances for this template
   - If count < template.poolSize → return 'available'
   - Else → return 'queued', increment pool.queuedCount

2. releaseSlot(templateId):
   - Decrement pool.activeCount
   - Check queue → notify first queued user via NotificationsService

3. checkUserActiveInstance(userId, templateId):
   - Return existing RUNNING/STARTING instance if any
   - One active instance per user per template at any time
```

### `VmOrchestratorService` — Provider Abstraction

> Implements provider-agnostic interface. Step 5 implements `DOCKER_LOCAL` only. DigitalOcean adapter comes in Step 9.

```typescript
interface IVmProvider {
  createContainer(templateId: string, envVars: Record<string, string>): Promise<{ containerId: string; ip: string; vncPort: number }>;
  startContainer(containerId: string): Promise<void>;
  stopContainer(containerId: string): Promise<void>;
  getContainerStatus(containerId: string): Promise<'running' | 'stopped' | 'error'>;
  execInContainer(containerId: string, command: string): Promise<string>;
}
```

### `VmFlagService` — Flag Generation & Validation

```
Flag generation (per CyberRanger pattern, enhanced):
1. Generate random 32-char hex string: crypto.randomBytes(16).toString('hex')
2. Wrap: FLAG{<hex>}
3. Store as bcrypt hash in VmLabInstance.flag
4. Inject as env var into container: FLAG=FLAG{<hex>}

Flag validation:
1. Receive submitted flag from student
2. bcrypt.compare(submitted, instance.flag)
3. If match → mark flagSubmitted=true, calculate final score, award XP
4. If no match → log VmLabEvent(FLAG_SUBMITTED_WRONG), increment attempt count
5. Rate limit: max 10 attempts per 60 seconds per instance (Redis or in-memory)
```

### `VmSessionService` — VNC Token Management

```
Token flow:
1. On instance RUNNING → generate vncToken (UUID v4)
2. Set vncTokenExpiresAt = now + 15 minutes
3. Build accessUrl: https://vnc.cyberlabs.com/{instanceId}?token={vncToken}
4. Store in VmLabSession
5. On frontend request → validate token matches userId+instanceId
6. On expiry → auto-invalidate, require re-auth to get new token
```

### Acceptance Criteria — Step 5
- [ ] State transitions are enforced — invalid transitions throw `BadRequestException`
- [ ] Pool slot check happens BEFORE container creation
- [ ] Flag is never stored in plaintext
- [ ] VNC token is tied to userId+instanceId — cannot be used by another user
- [ ] `DOCKER_LOCAL` provider creates real containers via Docker socket
- [ ] All state transitions are logged in `VmLabEvent`

---

## 🌐 Step 6 — REST API Endpoints

**Goal:** Wire all business logic to HTTP endpoints.  
**Status:** ☐  
**Pre-condition:** Step 5 acceptance criteria all checked ✅  

### Student Endpoints (`/api/v1/vm-labs`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/vm-labs` | List all active VM lab templates (public metadata) |
| `GET` | `/vm-labs/:slug` | Get single template + current user's instance status |
| `POST` | `/vm-labs/:slug/start` | Start a new instance (or return existing running one) |
| `GET` | `/vm-labs/instances/:instanceId` | Get instance details + VNC access URL |
| `POST` | `/vm-labs/instances/:instanceId/extend` | Extend TTL by `template.extensionMin` |
| `POST` | `/vm-labs/instances/:instanceId/stop` | Gracefully stop the instance |
| `POST` | `/vm-labs/instances/:instanceId/submit-flag` | Submit CTF flag |
| `GET` | `/vm-labs/instances/:instanceId/hints` | List available hints + unlock status |
| `POST` | `/vm-labs/instances/:instanceId/hints/:index/unlock` | Unlock a hint (applies score penalty) |
| `GET` | `/vm-labs/instances/:instanceId/status` | Polling endpoint: current status + time remaining |

### Admin Endpoints (`/api/v1/admin/vm-labs`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/vm-labs/instances` | List all instances (filterable by status, template, user) |
| `POST` | `/admin/vm-labs/instances/:instanceId/terminate` | Force-terminate any instance |
| `GET` | `/admin/vm-labs/pool` | View pool capacity per template |
| `POST` | `/admin/vm-labs/templates` | Create a new VM lab template |
| `PATCH` | `/admin/vm-labs/templates/:id` | Update template config |

### Response Format (matches existing API)

```typescript
// Success
{ success: true, data: VmLabCardDTO, message?: string }

// Error
{ success: false, error: string, statusCode: number }
```

### Acceptance Criteria — Step 6
- [ ] All student routes protected by `JwtAuthGuard`
- [ ] All admin routes protected by `JwtAuthGuard` + `RolesGuard(ADMIN)`
- [ ] Response shape matches existing API responses (checked against practice-labs responses)
- [ ] Module registered in `app.module.ts` only in this step
- [ ] Swagger docs auto-generated for all endpoints

---

## ⚡ Step 7 — WebSocket Gateway (Live Status)

**Goal:** Replace polling with real-time instance status via WebSocket.  
**Status:** ☐  
**Pre-condition:** Step 6 acceptance criteria all checked ✅  

### Gateway Design

```
ws://api.cyberlabs.com/vm-labs

Events emitted to client:
  vm:status_update  → { instanceId, status, timeRemainingMin }
  vm:expiry_warning → { instanceId, minutesLeft: 10 }
  vm:flag_result    → { instanceId, correct: boolean, score?: number }
  vm:error          → { instanceId, message }

Events received from client:
  vm:heartbeat      → { instanceId } (every 30s — keeps instance alive)
  vm:disconnect     → { instanceId } (explicit disconnect)
```

### Heartbeat Logic

```
Client sends heartbeat every 30s →
  Server updates VmLabSession.lastHeartbeatAt
  If heartbeat stops for 5 minutes → set status = PAUSED
  If PAUSED for 30 minutes → auto-terminate
```

### Acceptance Criteria — Step 7
- [ ] Gateway uses `JwtWsGuard` (existing or new — no modifications to existing ws setup)
- [ ] Heartbeat correctly extends PAUSED grace period
- [ ] `vm:expiry_warning` fires exactly at 10 minutes before expiry via cron
- [ ] Client disconnect does NOT immediately stop the VM (PAUSED grace period applies)

---

## ⏱️ Step 8 — Cleanup Cron Jobs

**Goal:** Automated expiry, health checks, and queue processing.  
**Status:** ☐  
**Pre-condition:** Step 7 acceptance criteria all checked ✅  

### Cron Schedule

| Job | Frequency | Action |
|-----|-----------|--------|
| `checkExpiredInstances` | Every 2 minutes | Find instances where `expiresAt < now` and `status = RUNNING` → trigger stop |
| `sendExpiryWarnings` | Every 2 minutes | Find instances where `expiresAt < now + 10min` → send `vm:expiry_warning` WebSocket event + notification |
| `processQueue` | Every 1 minute | Check if any QUEUED instances can now start (pool has free slots) |
| `healthCheckRunningInstances` | Every 30 seconds | Ping each RUNNING container → if 3 consecutive failures → set ERROR |
| `syncPoolCounts` | Every 5 minutes | Recalculate `VmLabPool.activeCount` from actual DB state (drift correction) |
| `cleanupOldEvents` | Daily | Delete `VmLabEvent` records older than 90 days |

### Acceptance Criteria — Step 8
- [ ] Cron jobs run independently — failure of one does not affect others
- [ ] All cron actions are logged in `VmLabEvent` with `meta`
- [ ] Expired instances have their containers actually stopped (not just DB status updated)
- [ ] Queue processing respects per-template pool size

---

## 🔐 Step 9 — Security Hardening

**Goal:** Apply all security controls before any production deployment.  
**Status:** ☐  
**Pre-condition:** Step 8 acceptance criteria all checked ✅  

### Controls to Implement

| Control | Implementation |
|---------|---------------|
| Flag rate limiting | Throttler: 10 attempts / 60s per `userId+instanceId` |
| VNC token validation | Every VNC proxy request validates `userId` claim in token |
| Network isolation | Docker: `--network none` for `ISOLATED` mode; custom bridge for `LIMITED_EGRESS` |
| Resource limits | Docker `--cpus`, `--memory`, `--storage-opt` enforced per template |
| Instance ownership | Every `GET/POST /instances/:id` validates `instance.userId === req.user.id` |
| Admin audit trail | Every admin action writes to `VmLabEvent(ADMIN_TERMINATED)` with admin's userId |
| Env var secrets | `FLAG` value never returned in any API response after generation |
| VNC token expiry | Token invalid after 15 minutes; re-issue via `/instances/:id` endpoint |
| Max instances per user | Configurable: default 1 active VM lab per user (free tier) |
| Max daily starts | Configurable: default 5 VM lab starts per user per day |

### Acceptance Criteria — Step 9
- [ ] Flag submission returns `429` after 10 attempts in 60 seconds
- [ ] Attempting to access another user's instance returns `403`
- [ ] VNC token for expired instance returns `401`
- [ ] Docker container cannot reach other containers in `ISOLATED` mode (verified via `docker network inspect`)
- [ ] No `FLAG` value appears in any API response body or log

---

## ☁️ Step 10 — DigitalOcean Provider Adapter

**Goal:** Swap `DOCKER_LOCAL` for production DigitalOcean infrastructure.  
**Status:** ☐  
**Pre-condition:** Step 9 acceptance criteria all checked ✅  

### Architecture Decision: DOKS (Kubernetes) over Droplets

Use **DigitalOcean Kubernetes (DOKS)** not individual Droplets:
- Faster spawn (~30s for a Pod vs ~90s for a Droplet)
- Cheaper at scale (shared node pool)
- Native resource limits via K8s ResourceQuota
- Auto-scaling via HPA

### DigitalOcean Implementation

```
VmProviderType.DIGITAL_OCEAN adapter implements IVmProvider:

createContainer():
  1. Generate Kubernetes Pod manifest from VmLabTemplate
  2. Set namespace: vm-labs-{userId}
  3. Apply ResourceQuota: cpu={template.cpuLimit}, memory={template.ramLimitMb}Mi
  4. Apply NetworkPolicy: deny all ingress/egress except VNC proxy
  5. Submit via k8s client-node
  6. Return { podName, podIP, vncPort: 6080 }

stopContainer():
  1. kubectl delete pod {podName} -n vm-labs-{userId}
  2. If namespace has no other pods → delete namespace
```

### Environment Variables Required

```env
# DigitalOcean
DO_API_TOKEN=
DO_CLUSTER_ID=
DO_REGISTRY=registry.digitalocean.com/cyberlabs
DO_REGION=fra1

# VNC Proxy
VNC_PROXY_HOST=vnc.cyberlabs.com
VNC_TOKEN_SECRET=<32-char-random>
VNC_TOKEN_TTL_MIN=15

# VM Labs Config
VM_POOL_DEFAULT_SIZE=5
VM_MAX_INSTANCES_PER_USER=1
VM_MAX_DAILY_STARTS=5
VM_DEFAULT_TTL_MIN=120
```

### Acceptance Criteria — Step 10
- [ ] `VmProviderType` can be switched via env var `VM_PROVIDER=DOCKER_LOCAL|DIGITAL_OCEAN`
- [ ] New provider works without any changes to `VmLabsService` (adapter pattern)
- [ ] Pod namespaces are cleaned up after instance stops
- [ ] K8s NetworkPolicy verified: isolated Pod cannot ping other Pods
- [ ] Cost safeguard: admin alert if active instances > 20

---

## 🎨 Step 11 — Frontend Data Contract (Backend Deliverable)

**Goal:** Document exactly what data the frontend receives for each view.  
**Status:** ☐  
**Pre-condition:** Step 6 acceptance criteria all checked ✅ (can run parallel with Steps 7-10)  

### Lab Catalog Card (from `GET /vm-labs`)

```json
{
  "success": true,
  "data": [{
    "templateId": "uuid",
    "slug": "log4j-rce",
    "title": "Log4Shell RCE — CVE-2021-44228",
    "ar_title": "ثغرة Log4Shell",
    "difficulty": "INTERMEDIATE",
    "category": "PENETRATION_TESTING",
    "xpReward": 500,
    "estimatedDurationMin": 90,
    "osType": "KALI_LINUX",
    "networkMode": "ISOLATED",
    "toolsIncluded": ["nmap", "burpsuite", "curl"],
    "poolStatus": "AVAILABLE",
    "availableSlots": 4,
    "estimatedWaitMin": null,
    "userInstanceStatus": null,
    "userInstanceId": null,
    "userInstanceExpiresAt": null,
    "userProgress": null,
    "userFlagSubmitted": false
  }]
}
```

### Instance Status (from `GET /vm-labs/instances/:id/status`)

```json
{
  "success": true,
  "data": {
    "instanceId": "uuid",
    "status": "RUNNING",
    "timeRemainingMin": 87,
    "expiresAt": "2026-04-01T06:00:00Z",
    "vncAccessUrl": "https://vnc.cyberlabs.com/uuid?token=...",
    "flagSubmitted": false,
    "hintsUsed": 1,
    "currentScore": 80
  }
}
```

### Acceptance Criteria — Step 11
- [ ] Frontend team has approved DTO shapes before Step 6 implementation starts
- [ ] All date fields are ISO 8601 UTC strings
- [ ] `vncAccessUrl` is only present when `status === 'RUNNING'`
- [ ] `flag` value never appears in any response

---

## 🧪 All Scenarios — Expected Behaviors

### Scenario 1: Two Users Open Same Lab Simultaneously
- **Expected:** Each gets their own `VmLabInstance` with unique `containerId`, `flag`, and `vncToken`
- **Isolation:** Docker/K8s network prevents cross-instance communication
- **Pool impact:** `VmLabPool.activeCount` increments by 1 for each start

### Scenario 2: Pool Is Full (3rd User Requests, Pool Size = 2)
- **Expected:** 3rd user's instance created with `status = QUEUED`
- **Response:** API returns `poolStatus: 'QUEUED'`, `estimatedWaitMin: ~15`
- **Notification:** Sent immediately: "You're in queue. We'll notify you when your lab is ready."
- **When slot opens:** `processQueue` cron fires within 1 minute → 3rd instance moves to PROVISIONING → notification sent

### Scenario 3: User Forgets to Close Lab (TTL Expires)
- **10 min warning:** `sendExpiryWarnings` cron fires `vm:expiry_warning` WebSocket event + push notification
- **At TTL:** `checkExpiredInstances` cron changes status to EXPIRED → triggers `stopContainer()` → container destroyed
- **Score:** If flag not yet submitted → instance saved as EXPIRED, no XP awarded

### Scenario 4: User Tries to Access Another User's VNC
- **VNC URL:** Contains `instanceId` + `vncToken`
- **VNC proxy middleware:** Validates JWT claim `userId` matches `VmLabSession.userId`
- **Result:** `403 Forbidden`

### Scenario 5: Container Crashes Mid-Session
- **Health check cron:** 3 consecutive failures (90 seconds) → status = ERROR
- **WebSocket event:** `vm:error` sent to student
- **Student UI:** "Your lab environment crashed. Click to restart."
- **Restart:** Creates new `VmLabInstance` with same template — no score impact if within first 5 minutes

### Scenario 6: Same User Opens Lab on Two Devices
- **Check in `POST /start`:** If existing RUNNING instance found → return existing instance (no duplicate)
- **Second device:** Gets same VNC URL + fresh `vncToken` for that device
- **Result:** Both devices can view same container (legitimate use case — e.g., phone + laptop)

### Scenario 7: Flag Replay / Brute Force
- **Rate limit:** 10 flag submissions per 60 seconds per `userId+instanceId` → `429 Too Many Requests`
- **Flag uniqueness:** Each instance has a different flag (PER_USER_PER_ATTEMPT) → flags from other users are useless
- **After correct submission:** `flagSubmitted = true` → subsequent submissions return `400 Already submitted`

### Scenario 8: DigitalOcean Cost Runaway
- **Hard cap:** `VM_MAX_CONCURRENT_GLOBAL` env var (default: 50 instances)
- **Admin alert:** If `activeCount > 20` → Slack/email webhook notification
- **Free tier cap:** Max 1 active VM lab per free user at any time
- **Idle billing protection:** `PAUSED` instances (no heartbeat for 5 min) are auto-terminated after 30 min

### Scenario 9: Admin Needs to Terminate All Instances (Emergency)
- **Endpoint:** `DELETE /admin/vm-labs/instances` (bulk terminate)
- **Result:** All RUNNING/PROVISIONING/STARTING instances → STOPPED, containers destroyed
- **Audit:** `VmLabEvent(ADMIN_TERMINATED)` written for every instance with admin's `userId`

### Scenario 10: Hint Penalty Calculation
```
Template.maxScore = 100
Student unlocks Hint 0 (penalty: 20 points)
Student unlocks Hint 1 (penalty: 15 points)
Student submits correct flag:
  finalScore = 100 - 20 - 15 = 65
  XP awarded = template.xpReward * (65 / 100)
```

---

## 🔗 Integration with Existing Systems (Read-Only Usage)

### After Flag Submission (correct)
```
1. Update VmLabInstance: flagSubmitted=true, finalScore, flagSubmittedAt
2. Call UserLabProgress service → update progress for this lab
3. Call XPLog service → award XP (template.xpReward * score_multiplier)
4. Call PointsLog service → award points
5. Check badge conditions → award "VM Lab Solved" badge if exists
6. Write TrackingEvent: VM_LAB_COMPLETED
7. Send notification: "🎉 You solved [Lab Title]! +{xp} XP earned."
```

### After Instance Starts (RUNNING)
```
1. Write TrackingEvent: VM_LAB_STARTED
2. Send notification: "Your lab is ready! You have {ttl} minutes."
3. Update UserActivity.labsSolved (not yet — increment on completion only)
```

---

## 📋 Implementation Checklist (Master)

> Check off each item as it is completed. Never skip or reorder.

### Phase 1: Foundation
- [ ] **[1.1]** New enums added to schema.prisma (additive only)
- [ ] **[1.2]** New models added to schema.prisma (additive only)
- [ ] **[1.3]** Additive FK fields added to existing models
- [ ] **[1.4]** `npx prisma validate` passes
- [ ] **[2.1]** Migration file generated — reviewed for zero DROP statements
- [ ] **[2.2]** Migration applied to dev DB successfully
- [ ] **[2.3]** `npx prisma generate` completed
- [ ] **[2.4]** Existing test suite passes post-migration

### Phase 2: Module Scaffold
- [ ] **[3.1]** All 15 module files created (empty shells)
- [ ] **[3.2]** TypeScript compiles — zero errors
- [ ] **[3.3]** Module NOT yet in app.module.ts
- [ ] **[4.1]** All 5 DTOs defined with class-validator
- [ ] **[4.2]** All DTOs have Swagger @ApiProperty decorators

### Phase 3: Core Logic
- [ ] **[5.1]** State machine implemented and enforced
- [ ] **[5.2]** VmPoolService: slot management + queue logic
- [ ] **[5.3]** VmOrchestratorService: DOCKER_LOCAL adapter
- [ ] **[5.4]** VmFlagService: generation (bcrypt) + validation (rate-limited)
- [ ] **[5.5]** VmSessionService: VNC token generation + validation
- [ ] **[5.6]** VmHintService: unlock + penalty calculation

### Phase 4: API & Realtime
- [ ] **[6.1]** All student endpoints implemented
- [ ] **[6.2]** All admin endpoints implemented
- [ ] **[6.3]** Module registered in app.module.ts
- [ ] **[6.4]** Swagger docs verified
- [ ] **[7.1]** WebSocket gateway implemented
- [ ] **[7.2]** Heartbeat + PAUSED logic verified

### Phase 5: Automation & Hardening
- [ ] **[8.1]** All 6 cron jobs implemented
- [ ] **[8.2]** Cron jobs tested against dev DB
- [ ] **[9.1]** All 10 security controls implemented
- [ ] **[9.2]** Security controls manually verified

### Phase 6: Production
- [ ] **[10.1]** DigitalOcean Kubernetes adapter implemented
- [ ] **[10.2]** Provider switch via env var tested
- [ ] **[10.3]** Cost safeguards verified
- [ ] **[11.1]** Frontend data contract approved
- [ ] **[11.2]** All scenario edge cases tested end-to-end

---

*Document maintained by: Platform Architecture Team*  
*Last updated: 2026-04-01*  
*All commits to: `main` branch only*
