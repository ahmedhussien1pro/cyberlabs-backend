/**
 * VmLabsOrchestratorService — HTTP Proxy Layer
 *
 * Architecture:
 *   cyberlabs-frontend-labs  →  cyberlabs-backend (this service)
 *                                     ↓ authenticated HTTP proxy
 *                              cyberlabs-vm-service  (K8s / Guacamole)
 *
 * Uses native axios (already in package.json) — NOT @nestjs/axios.
 *
 * VM-Service API contract:
 *   POST   /api/v1/instances                       → create instance (202)
 *   GET    /api/v1/instances/:id                   → get status
 *   DELETE /api/v1/instances/:id                   → stop
 *   POST   /api/v1/instances/:id/extend            → extend +30 min
 *   POST   /api/v1/instances/:id/flag              → submit flag
 *   POST   /api/v1/instances/:id/hints/:index      → unlock hint
 *
 * Security:
 *   [9.1] Flag rate limiting → VmLabsThrottler
 *   [9.5] Ownership assertion before every proxy call
 *   [9.8] x-vm-api-key on every outbound request
 *   [9.9] x-user-id injected server-side — never from client body
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
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../../core/database/prisma.service';
import { VmLabsThrottler } from './vm-labs.throttler';

@Injectable()
export class VmLabsOrchestratorService {
  private readonly logger = new Logger(VmLabsOrchestratorService.name);

  private readonly vmServiceUrl =
    (process.env.VM_SERVICE_URL ?? 'http://localhost:3001').replace(/\/$/, '') + '/api/v1';

  private readonly vmApiKey = process.env.VM_SERVICE_API_KEY ?? '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly throttler: VmLabsThrottler,
  ) {
    if (!this.vmApiKey) {
      this.logger.warn('[VmProxy] VM_SERVICE_API_KEY is not set!');
    }
  }

  // ── Start Lab ─────────────────────────────────────────────────────

  async startLab(userId: string, labId: string) {
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: labId },
      select: { id: true, isActive: true, title: true, slug: true },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not currently active');

    const result = await this._proxy('POST', '/instances', {
      userId,
      templateSlug: template.slug,
    });

    if (result?.instanceId) {
      await this.prisma.vmLabInstance.upsert({
        where:  { id: result.instanceId },
        create: { id: result.instanceId, userId, templateId: template.id, status: 'QUEUED' },
        update: { userId, templateId: template.id, status: 'QUEUED' },
      });
    }

    return result;
  }

  // ── Instance management ──────────────────────────────────────────────

  async listUserInstances(userId: string) {
    return this._proxy('GET', `/instances?userId=${encodeURIComponent(userId)}`, undefined, userId);
  }

  async getInstance(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('GET', `/instances/${instanceId}`, undefined, userId);
  }

  async stopLab(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    return this._proxy('DELETE', `/instances/${instanceId}`, undefined, userId);
  }

  async extendSession(userId: string, instanceId: string) {
    await this._assertOwnership(userId, instanceId);
    const result = await this._proxy('POST', `/instances/${instanceId}/extend`, undefined, userId);

    const expiresAt: string = result?.expiresAt ?? result?.message;
    const secondsRemaining = result?.secondsRemaining ??
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);

    return {
      expiresAt,
      extensionsUsed:  result?.extensionsUsed ?? 1,
      secondsRemaining,
    };
  }

  // ── Flag Submission [9.1] ──────────────────────────────────────────────

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

  async adminListInstances(
    status?: string,
    templateId?: string,
    userId?: string,
    page = 1,
    limit = 20,
  ) {
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

  async adminCreateTemplate(dto: Record<string, unknown>) {
    return this.prisma.vmLabTemplate.create({ data: dto as any });
  }

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async _assertOwnership(userId: string, instanceId: string): Promise<void> {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where:  { id: instanceId },
      select: { userId: true },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    if (instance.userId !== userId) throw new ForbiddenException('Access denied');
  }

  /**
   * Generic HTTP proxy — uses native axios.
   * [9.8] x-vm-api-key on every request.
   * [9.9] x-user-id server-injected, never from client.
   */
  private async _proxy(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: object,
    userId?: string,
  ): Promise<any> {
    const url = `${this.vmServiceUrl}${path}`;
    const headers: Record<string, string> = {
      'x-vm-api-key':  this.vmApiKey,
      'content-type':  'application/json',
    };
    if (userId) headers['x-user-id'] = userId;

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body,
        timeout: 30_000,
        maxRedirects: 0,
      });
      return response.data;
    } catch (err: unknown) {
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
