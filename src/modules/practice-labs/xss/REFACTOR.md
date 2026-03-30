# XSS Labs — Refactor Notes

> Last updated: PR #3

## What Changed

### Before PR #3
- Each lab service had its own private `isXSSPayload()` method (duplicated 5 times)
- All flags were hardcoded strings (e.g. `FLAG{XSS_REFLECT_ASSET_MGR_101}`)
- `FlagRecordService` existed but was never called in XSS services
- Detection coverage was inconsistent across labs (some labs missed `<body>`, `<video>`, `<audio>` vectors)
- lab3: empty `msg` param returned `success: false` without throwing — now throws `BadRequestException`

### After PR #3
- `isXSSPayload()` removed from all 5 services
- All detection routed through `XssDetectorEngine.isPayload()` / `.detect()`
- All flags generated dynamically via `FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX)`
- `FlagRecordService.generateAndStore()` called in every `initLab()`
- Detection now covers: `<body>`, `<video>`, `<audio>`, `<input autofocus>`, `data:text/html`, `vbscript:`

## Lab Index

| Lab | Type | Vulnerable Endpoint | Injection Point |
|-----|------|---------------------|-----------------|
| lab1 | Reflected XSS | `POST /search` | `query` body param → HTML response |
| lab2 | Stored XSS | `POST /submit-review` → `POST /admin-moderate` | `content` stored → admin innerHTML |
| lab3 | DOM-Based XSS | `POST /verify-payload` | `?msg=` URL param → innerHTML sink (client-side) |
| lab4 | XSS via Markdown | `POST /update-bio` → `POST /admin-review-profile` | `bio` stored → marked.parse() + innerHTML |
| lab5 | Second-Order XSS | `POST /create-webhook` → `POST /admin-view-activity-log` | `name` stored → activity log innerHTML |

## Adding a New XSS Lab

1. Create `labs/lab6/` with `lab6.controller.ts`, `lab6.service.ts`, `lab6.metadata.ts`
2. Import `XssDetectorEngine` from `../../shared/engines/xss-detector.engine`
3. Import `FlagPolicyEngine` from `../../shared/engines/flag-policy.engine`
4. Import `FlagRecordService` from `../../shared/services/flag-record.service`
5. Define `LAB_SECRET` (unique string), `FLAG_PREFIX` (e.g. `'XSS_LAB6'`)
6. Call `FlagPolicyEngine.generate()` + `flagRecord.generateAndStore()` in `initLab()`
7. Use `XssDetectorEngine.isPayload(input)` for detection — **never write a local `isXSSPayload()`**
8. Add the lab to `xss.module.ts`
9. Update this file with the new lab entry

## Architecture

```
shared/engines/
├── flag-policy.engine.ts     ← HMAC-SHA256 dynamic flag generation
├── xss-detector.engine.ts    ← Centralised XSS detection (all vectors)
└── csrf-detector.engine.ts   ← Centralised CSRF exploit evaluation
```

## Security Note
`LAB_SECRET` constants are backend-only and never returned to the client.
The flag format is: `FLAG{XSS_LABn_<16-char HMAC hex>}`
