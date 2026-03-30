// src/modules/practice-labs/practice-labs.service.ts
// ✅ PR #1 REFACTOR: This file is now a pure orchestrator.
// All business logic has been extracted to focused service modules:
//   • LabCatalogService     → services/lab-catalog.service.ts
//   • LabLaunchService      → services/lab-launch.service.ts
//   • FlagSubmissionService → services/flag-submission.service.ts
//   • HintDeliveryService   → services/hint-delivery.service.ts
//
// The public method signatures and return shapes are IDENTICAL to before.
// Zero breaking changes — controller unchanged.

import { Injectable } from '@nestjs/common';
import { LabCatalogService } from './services/lab-catalog.service';
import { LabLaunchService } from './services/lab-launch.service';
import { FlagSubmissionService } from './services/flag-submission.service';
import { HintDeliveryService } from './services/hint-delivery.service';

@Injectable()
export class PracticeLabsService {
  constructor(
    private readonly catalog: LabCatalogService,
    private readonly launch: LabLaunchService,
    private readonly flagSubmission: FlagSubmissionService,
    private readonly hintDelivery: HintDeliveryService,
  ) {}

  getAllLabs(userId?: string) {
    return this.catalog.getAllLabs(userId);
  }

  getStats() {
    return this.catalog.getStats();
  }

  getUserProgress(userId: string, labId?: string) {
    return this.catalog.getUserProgress(userId, labId);
  }

  getLabById(labId: string, userId?: string) {
    return this.catalog.getLabById(labId, userId);
  }

  getAdminSolution(labId: string) {
    return this.catalog.getAdminSolution(labId);
  }

  launchLab(labId: string, userId: string) {
    return this.launch.launchLab(labId, userId);
  }

  consumeToken(token: string, userId: string) {
    return this.launch.consumeToken(token, userId);
  }

  submitFlag(labId: string, userId: string, flag: string, attemptId?: string) {
    return this.flagSubmission.submitFlag(labId, userId, flag, attemptId);
  }

  getHint(labId: string, userId: string, hintOrder: number) {
    return this.hintDelivery.getHint(labId, userId, hintOrder);
  }
}
