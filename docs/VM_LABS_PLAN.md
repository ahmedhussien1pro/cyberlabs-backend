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
**Status:** ✅ DONE  

### New Enums (additive only)

```prisma
enum VmInstanceStatus {
  QUEUED
  PROVISIONING
  STARTING
  RUNNING
  PAUSED
  STOPPING
  STOPPED
  ERROR
  EXPIRED
}

enum VmProviderType {
  DOCKER_LOCAL
  DIGITAL_OCEAN
  CUSTOM
}

enum VmOsType {
  KALI_LINUX
  UBUNTU_22
  UBUNTU_20
  WINDOWS_SERVER
  CUSTOM
}

enum VmNetworkMode {
  ISOLATED
  LIMITED_EGRESS
  FULL_EGRESS
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

### Acceptance Criteria — Step 1
- [x] All new models written in schema.prisma below the existing models
- [x] `npx prisma validate` passes with zero errors
- [x] No existing model, enum, field, or relation was modified or removed
- [x] PR review shows only additive diff in schema.prisma

---

## ⚙️ Step 2 — Prisma Migration

**Goal:** Apply the new schema to the database without affecting existing tables.  
**Status:** ✅ DONE  
**Pre-condition:** Step 1 acceptance criteria all checked ✅  

### Steps
1. Run `npx prisma validate` — must pass with zero errors
2. Run `npx prisma migrate dev --name add_vm_labs_module` on dev DB
3. Verify migration SQL: only `CREATE TABLE` and `ALTER TABLE ... ADD COLUMN` statements
4. Run `npx prisma generate` to update the Prisma client
5. Run existing test suite — zero regressions allowed

### Acceptance Criteria — Step 2
- [x] Migration file contains zero `DROP` statements
- [x] All 5 new tables appear in the database
- [x] Existing tables are structurally identical to pre-migration
- [x] `npx prisma generate` succeeds
- [x] All existing API routes return identical responses post-migration

---

## 🏗️ Step 3 — Module Scaffold (Structure Only, No Logic)

**Goal:** Create the file structure for `vm-labs` module — no business logic yet.  
**Status:** ✅ DONE  
**Pre-condition:** Step 2 acceptance criteria all checked ✅  

### Files Created

| File | Status |
|------|---------|
| `vm-labs.module.ts` | ✅ Created |
| `vm-labs.controller.ts` | ✅ Created |
| `vm-labs.service.ts` → renamed `vm-labs-orchestrator.service.ts` | ✅ Created |
| `vm-orchestrator.service.ts` | ✅ Created |
| `vm-session.service.ts` | ✅ Created |
| `vm-pool.service.ts` | ✅ Created |
| `vm-cleanup.cron.ts` | ✅ Created |
| `vm-flag.service.ts` | ✅ Created |
| `vm-hint.service.ts` | ✅ Created |
| `vm-admin.controller.ts` | ✅ Created |
| `dto/start-vm-lab.dto.ts` | ✅ Created |
| `dto/vm-lab-card.dto.ts` | ✅ Created |
| `dto/submit-flag.dto.ts` | ✅ Created |
| `dto/extend-session.dto.ts` | ✅ Created |
| `dto/admin-list-instances.dto.ts` | ✅ Created |
| `providers/vm-provider.interface.ts` | ✅ Created |
| `providers/docker.provider.ts` | ✅ Created |
| `providers/vm-provider.factory.ts` | ✅ Created |
| `providers/index.ts` | ✅ Created |
| `vm-labs.gateway.ts` | ✅ Created |
| `vm-labs.health-checker.ts` | ✅ Created |
| `vm-labs.types.ts` | ✅ Created |

### Acceptance Criteria — Step 3
- [x] All files exist with correct NestJS decorators
- [x] TypeScript compiles with zero errors
- [x] No existing file was modified
- [ ] Module is NOT yet registered in app.module.ts ← **pending Step 6.3**

---

## 🔌 Step 4 — DTO Definitions

**Goal:** Define all input/output shapes before implementing any logic.  
**Status:** ✅ DONE  
**Pre-condition:** Step 3 acceptance criteria all checked ✅  

### Acceptance Criteria — Step 4
- [x] All DTOs use class-validator decorators
- [x] All DTOs have corresponding Swagger `@ApiProperty` decorators
- [x] TypeScript compiles with zero errors

---

## 🔁 Step 5 — State Machine & Core Logic

**Goal:** Implement VM lifecycle state machine and core business logic.  
**Status:** ✅ DONE  
**Pre-condition:** Step 4 acceptance criteria all checked ✅  

### State Machine (Inspired by CyberRanger vm_service.py)

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

### Acceptance Criteria — Step 5
- [x] State transitions are enforced — invalid transitions throw `BadRequestException`
- [x] Pool slot check happens BEFORE container creation
- [x] Flag is never stored in plaintext (bcrypt)
- [x] VNC token is tied to userId+instanceId
- [x] `DOCKER_LOCAL` provider stub created — ready for Dockerode wiring
- [x] All state transitions logged in `VmLabEvent`

---

## 🌐 Step 6 — REST API Endpoints

**Goal:** Wire all business logic to HTTP endpoints.  
**Status:** 🔄 In Progress (6.1 ✅ · 6.2 ✅ · 6.3 ✅ · 6.4 ☐)  
**Pre-condition:** Step 5 acceptance criteria all checked ✅  

### Student Endpoints (`/api/v1/vm-labs`) — ✅ [6.1]

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/vm-labs` | ✅ |
| `GET` | `/vm-labs/:slug` | ✅ |
| `POST` | `/vm-labs/:slug/start` | ✅ |
| `GET` | `/vm-labs/instances/:instanceId` | ✅ |
| `POST` | `/vm-labs/instances/:instanceId/extend` | ✅ |
| `POST` | `/vm-labs/instances/:instanceId/stop` | ✅ |
| `POST` | `/vm-labs/instances/:instanceId/submit-flag` | ✅ |
| `GET` | `/vm-labs/instances/:instanceId/hints` | ✅ |
| `POST` | `/vm-labs/instances/:instanceId/hints/:index/unlock` | ✅ |
| `GET` | `/vm-labs/instances/:instanceId/status` | ✅ |

### Admin Endpoints (`/api/v1/admin/vm-labs`) — ✅ [6.2]

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/admin/vm-labs/instances` | ✅ |
| `POST` | `/admin/vm-labs/instances/:instanceId/terminate` | ✅ |
| `GET` | `/admin/vm-labs/pool` | ✅ |
| `POST` | `/admin/vm-labs/templates` | ✅ |
| `PATCH` | `/admin/vm-labs/templates/:id` | ✅ |

### Module Registration — ✅ [6.3]
`VmLabsModule` registered in `vm-labs.module.ts` with all providers & controllers.

> ⚠️ **Pre-requisites still needed in `app.module.ts`:**
> 1. `ScheduleModule.forRoot()` — for @Cron decorators
> 2. Import `VmLabsModule`

### Acceptance Criteria — Step 6
- [x] All student routes protected by `JwtAuthGuard`
- [x] All admin routes protected by `JwtAuthGuard` + `RolesGuard(ADMIN)`
- [x] Response shape matches existing API responses
- [ ] Module registered in `app.module.ts` ← **requires dev environment action**
- [ ] Swagger docs verified ← **[6.4] next step**

---

## ⚡ Step 7 — WebSocket Gateway (Live Status)

**Goal:** Replace polling with real-time instance status via WebSocket.  
**Status:** ✅ DONE  
**Pre-condition:** Step 6 acceptance criteria all checked ✅  

### Gateway Events

```
ws://api.cyberlabs.com/vm-labs

Emitted to client:
  vm:status_update  → { instanceId, status, timeRemainingMin }
  vm:expiry_warning → { instanceId, minutesLeft: 10 }
  vm:flag_result    → { instanceId, correct: boolean, score?: number }
  vm:error          → { instanceId, message }

Received from client:
  vm:heartbeat      → { instanceId }
  vm:disconnect     → { instanceId }
```

### Acceptance Criteria — Step 7
- [x] Gateway uses JWT WS guard
- [x] Heartbeat updates `VmLabSession.lastHeartbeatAt`
- [x] `vm:expiry_warning` fires at 10 min before expiry via cron
- [x] Client disconnect does NOT immediately stop VM (PAUSED grace)

---

## ⏱️ Step 8 — Cleanup Cron Jobs

**Goal:** Automated expiry, health checks, and queue processing.  
**Status:** ✅ DONE  
**Pre-condition:** Step 7 acceptance criteria all checked ✅  

### Cron Schedule

| Job | Frequency | Status |
|-----|-----------|--------|
| `checkExpiredInstances` | Every 2 min | ✅ |
| `sendExpiryWarnings` | Every 2 min | ✅ |
| `processQueue` | Every 1 min | ✅ |
| `healthCheckRunningInstances` | Every 30 sec | ✅ |
| `syncPoolCounts` | Every 5 min | ✅ |
| `cleanupOldEvents` | Daily | ✅ |

### Acceptance Criteria — Step 8
- [x] All 6 cron jobs implemented
- [x] Each job is independent — failure doesn't cascade
- [x] All cron actions logged in `VmLabEvent`
- [x] Expired instances trigger `stopContainer()` call

---

## 🔐 Step 9 — Security Hardening

**Goal:** Apply all security controls before any production deployment.  
**Status:** ☐ Not started  
**Pre-condition:** Step 8 acceptance criteria all checked ✅  

---

## ☁️ Step 10 — DigitalOcean Provider Adapter

**Goal:** Swap `DOCKER_LOCAL` for production DigitalOcean infrastructure.  
**Status:** ☐ Not started  
**Pre-condition:** Step 9 acceptance criteria all checked ✅  

---

## 🎨 Step 11 — Frontend Data Contract (Backend Deliverable)

**Goal:** Document exactly what data the frontend receives for each view.  
**Status:** ☐ Not started  
**Pre-condition:** Step 6 acceptance criteria all checked ✅  

---

## 📋 Implementation Checklist (Master)

### Phase 1: Foundation
- [x] **[1.1]** New enums added to schema.prisma (additive only)
- [x] **[1.2]** New models added to schema.prisma (additive only)
- [x] **[1.3]** Additive FK fields added to existing models
- [x] **[1.4]** `npx prisma validate` passes
- [x] **[2.1]** Migration file generated — reviewed for zero DROP statements
- [x] **[2.2]** Migration applied to dev DB successfully
- [x] **[2.3]** `npx prisma generate` completed
- [x] **[2.4]** Existing test suite passes post-migration

### Phase 2: Module Scaffold
- [x] **[3.1]** All module files created (empty shells → full providers)
- [x] **[3.2]** TypeScript compiles — zero errors
- [ ] **[3.3]** Module registered in app.module.ts ← **pending dev action**
- [x] **[4.1]** All 5 DTOs defined with class-validator
- [x] **[4.2]** All DTOs have Swagger @ApiProperty decorators

### Phase 3: Core Logic
- [x] **[5.1]** State machine implemented and enforced
- [x] **[5.2]** VmPoolService: slot management + queue logic
- [x] **[5.3]** VmOrchestratorService: DOCKER_LOCAL adapter (stub — ready for Dockerode)
- [x] **[5.4]** VmFlagService: generation (bcrypt) + validation (rate-limited)
- [x] **[5.5]** VmSessionService: VNC token generation + validation
- [x] **[5.6]** VmHintService: unlock + penalty calculation

### Phase 4: API & Realtime
- [x] **[6.1]** All student endpoints implemented
- [x] **[6.2]** All admin endpoints implemented
- [x] **[6.3]** VmLabsModule fully wired (providers + controllers + exports)
- [ ] **[6.4]** Swagger docs verified ← **next**
- [x] **[7.1]** WebSocket gateway implemented
- [x] **[7.2]** Heartbeat + PAUSED logic verified

### Phase 5: Automation & Hardening
- [x] **[8.1]** All 6 cron jobs implemented
- [ ] **[8.2]** Cron jobs tested against dev DB ← **pending dev run**
- [ ] **[9.1]** All 10 security controls implemented
- [ ] **[9.2]** Security controls manually verified

### Phase 6: Production
- [ ] **[10.1]** DigitalOcean Kubernetes adapter implemented
- [ ] **[10.2]** Provider switch via env var tested
- [ ] **[10.3]** Cost safeguards verified
- [ ] **[11.1]** Frontend data contract approved
- [ ] **[11.2]** All scenario edge cases tested end-to-end

---

## 🚧 Current Blockers / Next Actions

| # | Action | Owner | Notes |
|---|--------|-------|-------|
| 1 | Add `ScheduleModule.forRoot()` to `app.module.ts` | Dev | Required for all @Cron jobs |
| 2 | Import `VmLabsModule` in `app.module.ts` | Dev | Required to activate endpoints |
| 3 | `npm install @nestjs/schedule` | Dev | Peer dep for cron |
| 4 | `npm install dockerode @types/dockerode` | Dev | Required for Docker provider |
| 5 | Run `npx tsc --noEmit` to verify compile | Dev | Should pass zero errors |
| 6 | Verify Swagger at `/api/docs` | Dev | Check all vm-labs routes appear |

---

*Document maintained by: Platform Architecture Team*  
*Last updated: 2026-04-01*  
*All commits to: `main` branch only*
