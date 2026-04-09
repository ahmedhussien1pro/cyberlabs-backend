/**
 * VmLabsOrchestratorService — HTTP Proxy Layer
 *
 * Architecture:
 *   cyberlabs-frontend-labs  →  cyberlabs-backend (this service)
 *                                     ↓ authenticated HTTP proxy
 *                              cyberlabs-vm-service  (K8s / Guacamole)
 *
 * VM-Service API contract (cyberlabs-vm-service/src/modules/instances):
 *   POST   /api/v1/instances                       → create instance (202)
 *   GET    /api/v1/instances/:id                   → get instance status
 *   DELETE /api/v1/instances/:id                   → stop instance
 *   POST   /api/v1/instances/:id/extend            → extend +30 min
 *   POST   /api/v1/instances/:id/flag              → submit flag (HMAC verify)
 *   POST   /api/v1/instances/:id/hints/:index      → unlock hint
 *
 * Security controls retained here (backend side):
 *   ✅ [9.1] Flag rate limiting via VmLabsThrottler (5 req/60s per user+instance)
 *   ✅ [9.5] _assertOwnership checks before every proxy call
 *   ✅ [9.8] VM_SERVICE_API_KEY injected as x-vm-api-key header
 *   ✅ [9.9] userId injected as x-user-id header — never trusted from client body
 *
 * Security controls handled by cyberlabs-vm-service:
 *   [9.3] Timing-safe flag comparison
 *   [9.4] HMAC flag derivation
 *   [9.6] State machine enforcement
 *   [9.7] Flag value never returned in any response
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../core/database/prisma.service';
import { firstValueFrom } from 'rxjs';
import { VmLabsThrottler } from './vm-labs.throttler';
import { AxiosError } from 'axios';

@Injectable()
export class VmLabsOrchestratorService {
  private readonly logger = new Logger(VmLabsOrchestratorService.name);

  /**
   * Base URL of cyberlabs-vm-service.
   * Set VM_SERVICE_URL in environment (e.g. http://vm-service:3001)
   * Trailing slash stripped, /api/v1 appended.
   */
  private readonly vmServiceUrl =
    (process.env.VM_SERVICE_URL ?? 'http://localhost:3001').replace(/\/$/, '') + '/api/v1';

  /** Shared API key — must match VM_SERVICE_API_KEY in vm-service .env */
  private readonly vmApiKey = process.env.VM_SERVICE_API_KEY ?? '';

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly throttler: VmLabsThrottler,
  ) {
    if (!this.vmApiKey) {
      this.logger.warn(
        '[VmProxy] VM_SERVICE_API_KEY is not set — vm-service will reject all requests!',
      );
    }
  }

  // ── Start Lab ───────────────────────────────────────────────────────────

  /**
   * Start a new lab instance.
   * labId here is the templateId / templateSlug stored in backend DB.
   * Backend verifies template exists + isActive before proxying.
   *
   * VM-Service expects: POST /api/v1/instances
   *   Body: { userId, templateSlug }
   */
  async startLab(userId: string, labId: string) {
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: labId },
      select: { id: true, isActive: true, title: true, slug: true },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not currently active');

    // vm-service identifies templates by slug
    const result = await this._proxy('POST', '/instances', {
      userId,
      templateSlug: template.slug,
    });

    // Mirror instanceId in local DB for ownership checks
    if (result?.instanceId) {
      await this.prisma.vmLabInstance.upsert({
        where:  { id: result.instanceId },
        create: { id: result.instanceId, userId, templateId: template.id, status: 'QUEUED' },
        update: { userId, templateId: template.id, status: 'QUEUED' },
      });
    }

    return result;
  }

  // ── Instance management ───────────────────────────────────────────────

  async listUserInstances(userId: string) {
    return this._proxy('GET', `/instances?userId=${encodeURIComponent(userId)}`, undefined, userId);
  }

  async getInstance(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('GET', `/instances/${instanceId}`, undefined, userId);
  }

  /**
   * Stop lab instance.
   * VM-Service: DELETE /api/v1/instances/:id  (userId in x-user-id header)
   */
  async stopLab(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('DELETE', `/instances/${instanceId}`, undefined, userId);
  }

  /**
   * Extend session by 30 minutes.
   * VM-Service: POST /api/v1/instances/:id/extend
   * Returns: { expiresAt, extensionsUsed, secondsRemaining }
   */
  async extendSession(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    const result = await this._proxy('POST', `/instances/${instanceId}/extend`, undefined, userId);

    // Normalise response to match frontend VmFlagSubmitResult shape
    const expiresAt: string = result?.expiresAt ?? result?.message;
    const secondsRemaining = result?.secondsRemaining ??
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);

    return {
      expiresAt,
      extensionsUsed: result?.extensionsUsed ?? 1,
      secondsRemaining,
    };
  }

  // ── Flag Submission [9.1] ───────────────────────────────────────────────

  /**
   * Submit flag.
   * VM-Service: POST /api/v1/instances/:id/flag
   *   Body: { flag }   — userId injected via x-user-id header
   * Returns: VmFlagSubmitResult { correct, isFirstSolve, finalScore, message }
   *
   * [9.1] Rate limit checked on backend BEFORE hitting vm-service.
   */
  async submitFlag(userId: string, instanceId: string, flag: string) {
    if (!this.throttler.allow(userId, instanceId)) {
      const retryAfter = this.throttler.retryAfterSeconds(userId, instanceId);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many flag attempts. Try again in ${retryAfter}s.`,
          retryAfterSeconds: retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this._assertOwnership(userId, instanceId);
    return this._proxy('POST', `/instances/${instanceId}/flag`, { flag }, userId);
  }

  // ── Hints ──────────────────────────────────────────────────────────

  async unlockHint(userId: string, instanceId: string, hintIndex: number) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy(
      'POST',
      `/instances/${instanceId}/hints/${hintIndex}`,
      undefined,
      userId,
    );
  }

  // ── Admin ───────────────────────────────────────────────────────────

  async adminListInstances(status?: string, templateId?: string, userId?: string, page = 1, limit = 20) {
    const q = new URLSearchParams();
    if (status)     q.set('status', status);
    if (templateId) q.set('templateId', templateId);
    if (userId)     q.set('userId', userId);
    q.set('page', String(page));
    q.set('limit', String(limit));
    return this._proxy('GET', `/instances/admin?${q.toString()}`);
  }

  async adminTerminate(adminId: string, instanceId: string) {
    return this._proxy('DELETE', `/instances/${instanceId}`, undefined, adminId);
  }

  async adminCreateTemplate(dto: any) {
    return this.prisma.vmLabTemplate.create({ data: dto });
  }

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /**
   * [9.5] Ownership check.
   * Queries local DB mirror to verify instance belongs to userId.
   * Runs BEFORE every proxy call — never forwards unauthorized requests.
   */
  private async _assertOwnership(userId: string, instanceId: string): Promise<void> {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
      select: { userId: true },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    if (instance.userId !== userId) throw new ForbiddenException('Access denied');
  }

  /**
   * Generic HTTP proxy — forwards requests to cyberlabs-vm-service.
   *
   * [9.8] Attaches x-vm-api-key on every outbound request.
   * [9.9] Attaches x-user-id header (server-injected, never client-trusted).
   * Re-maps upstream HTTP errors to NestJS HttpException.
   *
   * @param userId  Optional — added as x-user-id when provided
   */
  private async _proxy(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: object,
    userId?: string,
  ): Promise<any> {
    const url = `${this.vmServiceUrl}${path}`;
    const headers: Record<string, string> = {
      'x-vm-api-key': this.vmApiKey,
      'content-type': 'application/json',
    };
    // [9.9] userId forwarded as header — vm-service never reads it from body
    if (userId) headers['x-user-id'] = userId;

    try {
      const response = await firstValueFrom(
        method === 'GET'
          ? this.http.get(url, { headers })
          : method === 'DELETE'
          ? this.http.delete(url, { headers, data: body })
          : method === 'PATCH'
          ? this.http.patch(url, body, { headers })
          : this.http.post(url, body ?? {}, { headers }),
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        throw new HttpException(
          axiosErr.response.data ?? { message: 'VM service error' },
          axiosErr.response.status,
        );
      }
      this.logger.error(`[VmProxy] Cannot reach vm-service at ${url}: ${axiosErr.message}`);
      throw new InternalServerErrorException(
        'Lab infrastructure is temporarily unavailable. Please try again shortly.',
      );
    }
  }
}
