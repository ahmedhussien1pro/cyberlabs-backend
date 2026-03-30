# CSRF Labs — Refactor Notes

> Last updated: PR #3

## What Changed

### Before PR #3
- All flags were hardcoded strings (e.g. `FLAG{CSRF_BASIC_EMAIL_HIJACK_NO_TOKEN_SOCIAL}`)
- Exploit condition logic was inline in each service (duplicated, inconsistent)
- `FlagRecordService` existed but was never called in CSRF services
- No shared abstraction for CSRF detection patterns

### After PR #3
- All flags generated dynamically via `FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX)`
- `FlagRecordService.generateAndStore()` called in every `initLab()`
- Each lab's exploit condition is evaluated by the appropriate `CsrfDetectorEngine` method
- A new `exploitReason` field in the response explains WHY the attack was detected (educational)

## Lab Index

| Lab | CSRF Variant | Vulnerable Endpoint | Key Concept |
|-----|-------------|---------------------|-------------|
| lab1 | Basic — No Token | `POST /change-email` | No CSRF token + no Origin check |
| lab2 | JSON API Content-Type Bypass | `POST /transfer` | API accepts form-encoded → CSRF via HTML form |
| lab3 | SameSite=Lax + GET State Change | `GET /update-grade` | Lax cookies sent on top-level GET navigation |
| lab4 | CORS Wildcard Subdomain | `POST /deploy` | `*.domain.com` CORS + no CSRF token = subdomain attack |
| lab5 | Predictable CSRF Token | `POST /profile/update` | MD5(userId+date) token = attacker can predict victim's token |

## CsrfDetectorEngine Methods

| Method | Used In |
|--------|---------|
| `basicCrossOrigin()` | lab1 |
| `jsonApiContentTypeBypass()` | lab2 |
| `samesiteLaxBypassGet()` | lab3 |
| `corsWildcardSubdomain()` | lab4 |
| `predictableToken()` | lab5 |

## Adding a New CSRF Lab

1. Create `labs/lab6/` with controller + service + metadata
2. Import `CsrfDetectorEngine` from `../../shared/engines/csrf-detector.engine`
3. Import `FlagPolicyEngine` and `FlagRecordService`
4. Define `LAB_SECRET` + `FLAG_PREFIX` + `TRUSTED_DOMAIN`
5. Choose the appropriate `CsrfDetectorEngine` method (or add a new one if it's a new variant)
6. Call `generateAndStore()` in `initLab()`
7. Add to `csrf.module.ts` and update this file

## Architecture

```
shared/engines/
├── flag-policy.engine.ts      ← HMAC-SHA256 dynamic flag generation
├── csrf-detector.engine.ts    ← CSRF exploit condition evaluation
└── xss-detector.engine.ts     ← XSS payload detection
```

## Security Note
`LAB_SECRET` is backend-only — never returned to the client.
Flag format: `FLAG{CSRF_LABn_<16-char HMAC hex>}`
