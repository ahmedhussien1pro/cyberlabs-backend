// src/modules/practice-labs/wireshark/labs/lab1/lab1.service.ts
// LAB 1 — HTTP Credentials in Plaintext
//
// Challenge design:
//   The student opens the .pcap in Wireshark (or uses the simulation).
//   They see a normal POST /portal/auth/login — username/password look like real creds.
//   The LOGIN SUCCEEDS (302 redirect).
//   The 302 response sets a session cookie AND a custom X-Auth-Token header.
//   The flag is the value of X-Auth-Token — visible only by inspecting the RESPONSE headers.
//   The POST body contains REAL-LOOKING credentials (no flag there).
//
// Why this is harder than the original:
//   - Student must look at the response, not just the request.
//   - Flag is not labelled "flag" — it looks like a real auth token.
//   - Requires "Follow TCP Stream" or packet inspector to read response headers.
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB1-HTTP-CREDS';
const PCAP_FILE   = 'lab1_http_creds.pcap';
const PCAP_PATH   = path.resolve(process.cwd(), 'labs_assets', 'WireShark', PCAP_FILE);

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(
      userId, result.labId, 'lab1-attempt', result.dynamicFlag, 24,
    );
    return { status: 'success', message: 'Lab environment initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // ── Packet list ──────────────────────────────────────────────────────────
    // Flag is ONLY in packet 5 (server 302 response), inside X-Auth-Token header.
    // The POST body (packet 4) has realistic-looking credentials — NO flag there.
    const packets = [
      {
        no: 1, time: '0.000000',
        source: '192.168.1.12', destination: '192.168.1.1',
        protocol: 'TCP', length: 74,
        info: '52841 → 80 [SYN] Seq=0 Win=64240 Len=0',
      },
      {
        no: 2, time: '0.000812',
        source: '192.168.1.1', destination: '192.168.1.12',
        protocol: 'TCP', length: 74,
        info: '80 → 52841 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0',
      },
      {
        no: 3, time: '0.001204',
        source: '192.168.1.12', destination: '192.168.1.1',
        protocol: 'TCP', length: 66,
        info: '52841 → 80 [ACK] Seq=1 Ack=1 Win=64240 Len=0',
      },
      {
        // POST body has real-looking creds — flag is NOT here
        no: 4, time: '0.001990',
        source: '192.168.1.12', destination: '192.168.1.1',
        protocol: 'HTTP', length: 312,
        info: 'POST /portal/auth/login HTTP/1.1',
        httpData: {
          method: 'POST',
          uri: '/portal/auth/login',
          version: 'HTTP/1.1',
          headers: {
            Host: '192.168.1.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '39',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            Connection: 'keep-alive',
          },
          // Real-looking credentials — NOT the flag
          body: 'username=j.henderson&password=Henderson@2024!',
        },
      },
      {
        // ← FLAG is here: X-Auth-Token response header
        no: 5, time: '0.014600',
        source: '192.168.1.1', destination: '192.168.1.12',
        protocol: 'HTTP', length: 248,
        info: 'HTTP/1.1 302 Found',
        httpData: {
          status: 302,
          headers: {
            Location: '/portal/dashboard',
            // Flag lives here — student must inspect response headers
            'X-Auth-Token': dynamicFlag,
            'Set-Cookie': 'session=eyJ1c2VyIjoiai5oZW5kZXJzb24ifQ==; Path=/; HttpOnly',
            'Cache-Control': 'no-store',
          },
        },
      },
      {
        no: 6, time: '0.015100',
        source: '192.168.1.12', destination: '192.168.1.1',
        protocol: 'HTTP', length: 284,
        info: 'GET /portal/dashboard HTTP/1.1',
        httpData: {
          method: 'GET',
          uri: '/portal/dashboard',
          headers: {
            Host: '192.168.1.1',
            Cookie: 'session=eyJ1c2VyIjoiai5oZW5kZXJzb24ifQ==',
          },
        },
      },
      {
        no: 7, time: '0.028400',
        source: '192.168.1.1', destination: '192.168.1.12',
        protocol: 'HTTP', length: 6204,
        info: 'HTTP/1.1 200 OK (text/html)',
        httpData: {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': '6138',
          },
        },
      },
    ];

    return {
      packets,
      downloadUrl: `/practice-labs/wireshark/lab1/download?labId=${resolvedLabId}`,
      fileName: PCAP_FILE,
    };
  }

  async streamPcap(_userId: string, _labId: string, res: Response) {
    if (!fs.existsSync(PCAP_PATH)) {
      throw new NotFoundException('Capture file not found.');
    }
    res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
    res.setHeader('Content-Disposition', `attachment; filename="${PCAP_FILE}"`);
    res.setHeader('Content-Length', fs.statSync(PCAP_PATH).size);
    fs.createReadStream(PCAP_PATH).pipe(res);
  }

  async getProgress(userId: string, labId: string) {
    try {
      const resolvedLabId = await this.stateService.resolveLabId(labId);
      const progress = await this.prisma.userLabProgress.findFirst({
        where: { userId, labId: resolvedLabId },
        select: { flagSubmitted: true, hintsUsed: true, startedAt: true, completedAt: true },
      });
      return {
        step: progress?.flagSubmitted ? 'COMPLETED' : 'RUNNING',
        flagSubmitted: progress?.flagSubmitted ?? false,
        hintsUsed: progress?.hintsUsed ?? 0,
        startedAt: progress?.startedAt ?? null,
        completedAt: progress?.completedAt ?? null,
      };
    } catch {
      return { step: 'RUNNING', flagSubmitted: false, hintsUsed: 0 };
    }
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const result = await this.flagRecord.verifyAndConsume(
      userId, resolvedLabId, 'lab1-attempt', submittedFlag.trim(),
    );
    if (result === 'correct') {
      return {
        success: true,
        flag: submittedFlag.trim(),
        message: 'Access confirmed.',
        explanation:
          'HTTP transmits all data in plaintext — including response headers. ' +
          'A passive sniffer on the same network can capture sensitive tokens like X-Auth-Token. ' +
          'Enforce HTTPS with HSTS to prevent credential interception.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Already submitted.' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Restart lab.' };
    return { success: false, message: 'Incorrect flag.' };
  }
}
