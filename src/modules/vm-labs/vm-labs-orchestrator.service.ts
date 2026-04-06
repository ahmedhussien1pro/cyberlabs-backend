/**
 * VmLabsOrchestratorService — HTTP Proxy Layer
 *
 * In the new architecture this service runs inside cyberlabs-backend (Vercel).
 * It does NOT touch Docker or spawn containers directly.
 * All heavy lifting is delegated to cyberlabs-vm-service (VPS) via authenticated HTTP.
 *
 * Security controls retained here (backend side):
 *   ✅ [9.1] Flag rate limiting via VmLabsThrottler (5 req/60s per user+instance)
 *   ✅ [9.5] _getOwnedInstance ownership check before every proxy call
 *   ✅ [9.8] VM_SERVICE_API_KEY injected as X-VM-Api-Key on every outbound request
 *   ✅ [9.9] userId is injected server-side — never trusted from client body
 *
 * Security controls moved to cyberlabs-vm-service:
 *   [9.3] Timing-safe flag comparison
 *   [9.4] HMAC flag derivation
 *   [9.6] State machine
 *   [9.7] Flag never returned in response
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

  /** Base URL of cyberlabs-vm-service — set VM_SERVICE_URL in Vercel env */
  private readonly vmServiceUrl =
    (process.env.VM_SERVICE_URL ?? 'http://localhost:3001').replace(/\/$/, '') + '/api/v1';

  /** Shared API key between backend and vm-service */
  private readonly vmApiKey = process.env.VM_SERVICE_API_KEY ?? '';

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly throttler: VmLabsThrottler,
  ) {
    if (!this.vmApiKey) {
      this.logger.warn(
        '[VmProxy] VM_SERVICE_API_KEY is not set — requests to vm-service will be rejected!',
      );
    }
  }

  // ── Start ──────────────────────────────────────────────────────────────────────

  async startLab(userId: string, templateId: string) {
    // Verify template exists and is active in local DB before proxying
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, isActive: true, title: true },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not currently active');

    return this._proxy('POST', '/vm-labs/start', { userId, templateId });
  }

  // ── Instance management ────────────────────────────────────────────────────────

  async listUserInstances(userId: string) {
    return this._proxy('GET', `/vm-labs/instances?userId=${encodeURIComponent(userId)}`);
  }

  async getInstance(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('GET', `/vm-labs/instances/${instanceId}?userId=${encodeURIComponent(userId)}`);
  }

  async stopLab(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('DELETE', `/vm-labs/instances/${instanceId}`, { userId });
  }

  async extendSession(userId: string, instanceId: string, minutes: number) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('PATCH', `/vm-labs/instances/${instanceId}/extend`, { userId, minutes });
  }

  // ── Flag submission [9.1] ──────────────────────────────────────────────────────

  async submitFlag(userId: string, instanceId: string, flag: string) {
    // [9.1] Rate-limit checked on backend before hitting vm-service
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
    return this._proxy('POST', `/vm-labs/instances/${instanceId}/flag`, { userId, flag });
  }

  // ── Hints ──────────────────────────────────────────────────────────────────────

  async unlockHint(userId: string, instanceId: string, hintIndex: number) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy(
      'POST',
      `/vm-labs/instances/${instanceId}/hints/${hintIndex}`,
      { userId },
    );
  }

  // ── Admin ───────────────────────────────────────────────────────────────────────

  async adminListInstances(status?, templateId?, userId?, page = 1, limit = 20) {
    const q = new URLSearchParams();
    if (status)     q.set('status', status);
    if (templateId) q.set('templateId', templateId);
    if (userId)     q.set('userId', userId);
    q.set('page', String(page));
    q.set('limit', String(limit));
    return this._proxy('GET', `/vm-labs/admin/instances?${q.toString()}`);
  }

  async adminTerminate(adminId: string, instanceId: string) {
    return this._proxy('DELETE', `/vm-labs/admin/instances/${instanceId}`, { adminId });
  }

  async adminCreateTemplate(dto: any) {
    // Templates are stored in the backend DB — skip proxy, write locally
    return this.prisma.vmLabTemplate.create({ data: dto });
  }

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────────

  /**
   * [9.5] Ownership check — queries local DB to verify the instance belongs to userId.
   * This runs BEFORE the proxy call so we never forward unauthorized requests.
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
   * [9.8] Attaches X-VM-Api-Key on every outbound request.
   * Re-maps upstream HTTP errors to NestJS HttpException so Vercel sees correct status codes.
   */
  private async _proxy(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: object,
  ): Promise<any> {
    const url = `${this.vmServiceUrl}${path}`;
    const headers = {
      'x-vm-api-key': this.vmApiKey,
      'content-type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        method === 'GET'
          ? this.http.get(url, { headers })
          : method === 'DELETE'
          ? this.http.delete(url, { headers, data: body })
          : method === 'PATCH'
          ? this.http.patch(url, body, { headers })
          : this.http.post(url, body, { headers }),
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        // Re-throw upstream status + message verbatim
        throw new HttpException(
          axiosErr.response.data ?? { message: 'VM service error' },
          axiosErr.response.status,
        );
      }
      // Network error (vm-service unreachable)
      this.logger.error(`[VmProxy] Cannot reach vm-service: ${axiosErr.message}`);
      throw new InternalServerErrorException(
        'Lab infrastructure is temporarily unavailable. Please try again shortly.',
      );
    }
  }
}
