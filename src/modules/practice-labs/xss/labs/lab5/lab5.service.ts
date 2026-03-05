import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// LabGenericContent fields: id, userId, labId, title, body, isPublic, author, fileUrl
// We use:
//   title   → webhook name  (❌ the injection point)
//   body    → 'webhook'     (record type identifier)
//   author  → status        ('active' | 'inactive')
//   fileUrl → endpoint URL
//
// LabGenericLog fields: id, userId, labId, type(required), value, action, meta(Json?), createdAt

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    await this.stateService.initializeState(userId, labId);

    // نزرع سجلات activity شرعية مبدئية
    await this.prisma.labGenericLog.createMany({
      data: [
        {
          userId,
          labId,
          type: 'ACTIVITY',
          action: 'WEBHOOK_CREATED',
          meta: {
            webhookName: 'Slack Notifications',
            createdBy: 'integration_manager',
            endpoint: 'https://hooks.slack.com/services/xxx',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
        },
        {
          userId,
          labId,
          type: 'ACTIVITY',
          action: 'WEBHOOK_TRIGGERED',
          meta: {
            webhookName: 'GitHub Deploy Trigger',
            triggeredBy: 'system',
            status: 'success',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        },
      ],
    });

    return { status: 'success', message: 'Lab environment initialized' };
  }

  // ✅ Webhook creation — يبدو آمنًا، لكن name مخزّن raw
  // هذا هو جوهر Second-Order: لا XSS عند التخزين
  async createWebhook(
    userId: string,
    labId: string,
    name: string,
    endpoint: string,
    events: string[],
  ) {
    if (!name) throw new BadRequestException('Webhook name is required');
    if (name.length > 200)
      throw new BadRequestException('Webhook name too long');

    const resolvedEndpoint = endpoint || 'https://example.com/hook';

    // ✅ يُخزَّن في LabGenericContent — name مخزّن raw في title
    await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: name, // ❌ name مخزّن raw بدون sanitization
        body: 'webhook',
        author: 'active', // status
        fileUrl: resolvedEndpoint, // endpoint URL
      },
    });

    // تسجيل الحدث في الـ Activity Log
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'ACTIVITY',
        action: 'WEBHOOK_CREATED',
        meta: {
          webhookName: name, // ❌ name يُخزَّن raw في الـ log
          createdBy: 'current_user',
          endpoint: resolvedEndpoint,
          events: events || ['push'],
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Webhook created successfully.`,
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
        id: w.id,
        name: w.title, // ❌ title يحتوي على الـ payload — يُعرض بـ innerHTML
        status: w.author,
        endpoint: w.fileUrl,
        isPublic: w.isPublic,
      })),
    };
  }

  // ❌ الثغرة تنشط هنا فقط — سياق مختلف تمامًا عن التخزين
  // Admin يعرض: logContainer.innerHTML += `<td>${entry.webhookName}</td>`
  async adminViewActivityLog(userId: string, labId: string) {
    const activityLogs = await this.prisma.labGenericLog.findMany({
      where: { userId, labId, type: 'ACTIVITY' },
      orderBy: { createdAt: 'desc' },
    });

    // فحص كل إدخال في الـ log عن XSS في اسم الـ webhook
    const maliciousEntry = activityLogs.find((log) => {
      const meta = log.meta as any;
      return meta?.webhookName && this.isXSSPayload(meta.webhookName);
    });

    if (maliciousEntry) {
      const meta = maliciousEntry.meta as any;
      return {
        success: true,
        exploited: true,
        adminAction: 'Super Admin opened the Activity Log Dashboard',
        triggerContext:
          'Activity Log → webhookName column → innerHTML rendering',
        injectedPayload: meta.webhookName,
        storageContext:
          'Payload stored via POST /webhook (integration creation)',
        executionContext:
          'Payload executed via POST /admin/activity-log (admin dashboard)',
        why:
          'Second-Order XSS: storage and execution happen in DIFFERENT contexts. ' +
          'The webhook creation endpoint looked safe. The vulnerability lived in ' +
          'the activity log renderer — a completely separate code path.',
        adminSessionToken: 'FLAG{XSS_2ND_ORDER_WEBHOOK_ADMIN_PWNED_X9}',
        flag: 'FLAG{XSS_2ND_ORDER_WEBHOOK_ADMIN_PWNED_X9}',
        fix:
          'Sanitize ALL stored user content at the point of rendering, ' +
          'not just at the point of storage. Use DOMPurify or textContent.',
        activityLog: activityLogs.map((l) => ({
          id: l.id,
          action: l.action,
          createdAt: l.createdAt,
          ...(l.meta as any),
        })),
      };
    }

    return {
      success: true,
      exploited: false,
      adminAction: 'Super Admin viewed Activity Log — no XSS payload detected.',
      hint: 'Create a webhook whose NAME contains an XSS payload, then trigger this endpoint.',
      activityLog: activityLogs.map((l) => ({
        id: l.id,
        action: l.action,
        createdAt: l.createdAt,
        ...(l.meta as any),
      })),
    };
  }

  private isXSSPayload(input: string): boolean {
    const patterns = [
      /<script[\s>]/i,
      /on\w+\s*=/i,
      /javascript:/i,
      /<img[^>]*>/i,
      /<svg[\s>]/i,
      /<iframe[\s>]/i,
      /<details[\s>]/i,
    ];
    return patterns.some((p) => p.test(input));
  }
}
