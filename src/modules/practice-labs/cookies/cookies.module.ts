// src/modules/practice-labs/cookies/cookies.module.ts
// ─────────────────────────────────────────────────────────────────────────────
// This module is a REFERENCE / CONFIG registry for cookie labs.
// The actual NestJS controllers & services are in:
//   → cookies-lab/labs/lab1  (route: practice-labs/cookies/lab1)
//   → cookies-lab/labs/lab2  (route: practice-labs/cookies/lab2)
// That module (CookiesLabModule) is already registered in practice-labs.module.ts.
//
// Lab config quick-reference:
//   Lab 1 — Plain-text role cookie manipulation
//     credentials : user@lab.com / password123
//     cookie      : role=user  →  change to  role=admin
//     flag        : FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}
//
//   Lab 2 — Base64 userId bypass
//     credentials : user@lab.com / password123
//     cookie      : userId=OQ== ("9")  →  change to  userId=MQ== ("1")
//     flag        : FLAG{BASE64_IS_NOT_ENCRYPTION}
//
//   Lab 3 — Session Fixation (TODO)
// ─────────────────────────────────────────────────────────────────────────────
import { Module } from '@nestjs/common';

@Module({})
export class CookiesModule {}
