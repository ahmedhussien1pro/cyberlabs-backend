// src/modules/practice-labs/xss/labs/lab5/lab5.service.ts
// Refactored (PR #3):
//  - Removed local isXSSPayload() → XssDetectorEngine.isPayload()
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - FlagRecordService wired in

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { XssDetectorEngine } from '../../../shared/engines/xss-detector.engine';

const LAB_SECRET  = 'xss_lab5_2nd_order_webhook_activitylog_2025';
const FLAG_PREFIX = 'XSS_LAB5';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, labId, 'attempt-1', flag);

    await this.prisma.labGenericLog.createMany({
      data: [
        {
          userId, labId, type: 'ACTIVITY', action: 'WEBHOOK_CREATED',
          meta: { webhookName: 'Slack Notifications', createdBy: 'integration_manager',
            endpoint: 'https://hooks.slack.com/services/xxx',
            timestamp: new Date(Date.now() - 86400000).toISOString() },
        },
        {
          userId, labId, type: 'ACTIVITY', action: 'WEBHOOK_TRIGGERED',
          meta: { webhookName: 'GitHub Deploy Trigger', triggeredBy: 'system',
            status: 'success', timestamp: new Date(Date.now() - 3600000).toISOString() },
        },
      ],
    });

    return { status: 'success', message: 'Lab environment initialized' };
  }

  async createWebhook(userId: string, labId: string, name: string, endpoint: string, events: string[]) {
    if (!name) throw new BadRequestException('Webhook name is required');
    if (name.length > 200) throw new BadRequestException('Webhook name too long');

    const resolvedEndpoint = endpoint || 'https://example.com/hook';

    await this.prisma.labGenericContent.create({
      data: { userId, labId, title: name, body: 'webhook', author: 'active', fileUrl: resolvedEndpoint },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId, labId, type: 'ACTIVITY', action: 'WEBHOOK_CREATED',
        meta: { webhookName: name, createdBy: 'current_user',
          endpoint: resolvedEndpoint, events: events || ['push'],
          timestamp: new Date().toISOString() },
      },
    });

    return {
      success: true, message: 'Webhook created successfully.',
      note: 'The webhook has been registered. It will appear in the Admin Activity Log.',
    };
  }

  async getWebhooks(userId: string, labId: string) {
    const webhooks = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, body: 'webhook' },
    });
    return {
      success: true,
      webhooks: webhooks.map((w) => ({
        id: w.id, name: w.title, status: w.author, endpoint: w.fileUrl, isPublic: w.isPublic,
      })),
    };
  }

  async adminViewActivityLog(userId: string, labId: string) {
    const activityLogs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId, type: 'ACTIVITY' },
      orderBy: { createdAt: 'desc' },
    });

    const maliciousEntry = activityLogs.find((log) => {
      const meta = log.meta as any;
      return meta?.webhookName && XssDetectorEngine.isPayload(meta.webhookName);
    });

    if (maliciousEntry) {
      const meta = maliciousEntry.meta as any;
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        adminAction: 'Super Admin opened the Activity Log Dashboard',
        triggerContext: 'Activity Log → webhookName column → innerHTML rendering',
        injectedPayload: meta.webhookName,
        storageContext: 'Payload stored via POST /webhook (integration creation)',
        executionContext: 'Payload executed via POST /admin/activity-log (admin dashboard)',
        why:
          'Second-Order XSS: storage and execution happen in DIFFERENT contexts. ' +
          'The webhook creation endpoint looked safe. The vulnerability lived in ' +
          'the activity log renderer — a completely separate code path.',
        flag,
        fix:
          'Sanitize ALL stored user content at the point of rendering, ' +
          'not just at the point of storage. Use DOMPurify or textContent.',
        activityLog: activityLogs.map((l) => ({ id: l.id, action: l.action, createdAt: l.createdAt, ...(l.meta as any) })),
      };
    }

    return {
      success: true, exploited: false,
      adminAction: 'Super Admin viewed Activity Log — no XSS payload detected.',
      hint: 'Create a webhook whose NAME contains an XSS payload, then trigger this endpoint.',
      activityLog: activityLogs.map((l) => ({ id: l.id, action: l.action, createdAt: l.createdAt, ...(l.meta as any) })),
    };
  }
}
