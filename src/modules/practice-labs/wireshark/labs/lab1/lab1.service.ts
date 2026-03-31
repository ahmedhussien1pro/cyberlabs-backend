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
// Flag determinism guarantee (no schema change):
//   generateDynamicFlag(prefix, userId, resolvedLabId) is a pure HMAC function.
//   As long as we always pass the RESOLVED UUID (not the slug) as labId,
//   the output is identical everywhere: initLab, getCapture, streamPcap.
//   The single fix: call stateService.resolveLabId() ONCE and reuse the UUID.

import { Injectable, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB1-HTTP-CREDS';
const ATTEMPT_ID  = 'lab1-attempt';
const PCAP_FILE   = 'lab1_http_creds.pcap';

// ─── minimal PCAP builder (pure Node — no dependencies) ───────────────────────
//
// Builds a valid libpcap (little-endian) buffer containing 7 Ethernet+IP+TCP
// frames that mirror the simulated packet list. Frame 5 embeds the flag in
// the HTTP/1.1 302 response X-Auth-Token header.

function u16le(v: number): Buffer { const b = Buffer.alloc(2); b.writeUInt16LE(v); return b; }
function u32le(v: number): Buffer { const b = Buffer.alloc(4); b.writeUInt32LE(v); return b; }

function csum(buf: Buffer): number {
  let s = 0;
  for (let i = 0; i < buf.length - 1; i += 2) s += buf.readUInt16BE(i);
  if (buf.length & 1) s += buf[buf.length - 1] << 8;
  while (s >> 16) s = (s & 0xffff) + (s >> 16);
  return (~s) & 0xffff;
}

function frame(
  si: string, di: string,
  sp: number, dp: number,
  seq: number, ack: number,
  fl: number,
  payload: Buffer = Buffer.alloc(0),
): Buffer {
  // Ethernet (14)
  const eth = Buffer.from([0x11,0x22,0x33,0x44,0x55,0x66,0xaa,0xbb,0xcc,0xdd,0xee,0xff,0x08,0x00]);

  // IPv4 (20)
  const ip = Buffer.alloc(20);
  ip[0] = 0x45; ip[1] = 0;
  ip.writeUInt16BE(20 + 20 + payload.length, 2);
  ip.writeUInt16BE(0xabcd, 4); ip.writeUInt16BE(0x4000, 6);
  ip[8] = 64; ip[9] = 6;
  si.split('.').forEach((o, i) => { ip[12 + i] = +o; });
  di.split('.').forEach((o, i) => { ip[16 + i] = +o; });
  ip.writeUInt16BE(csum(ip), 10);

  // TCP (20)
  const tcp = Buffer.alloc(20);
  tcp.writeUInt16BE(sp, 0); tcp.writeUInt16BE(dp, 2);
  tcp.writeUInt32BE(seq, 4); tcp.writeUInt32BE(ack, 8);
  tcp[12] = 0x50; tcp[13] = fl;
  tcp.writeUInt16BE(64240, 14);
  const ph = Buffer.alloc(12);
  si.split('.').forEach((o, i) => { ph[i] = +o; });
  di.split('.').forEach((o, i) => { ph[4 + i] = +o; });
  ph[9] = 6; ph.writeUInt16BE(20 + payload.length, 10);
  tcp.writeUInt16BE(csum(Buffer.concat([ph, tcp, payload])), 16);

  return Buffer.concat([eth, ip, tcp, payload]);
}

function pcapRec(f: Buffer, sec: number, usec: number): Buffer {
  const h = Buffer.alloc(16);
  h.writeUInt32LE(sec, 0); h.writeUInt32LE(usec, 4);
  h.writeUInt32LE(f.length, 8); h.writeUInt32LE(f.length, 12);
  return Buffer.concat([h, f]);
}

function buildPcap(dynamicFlag: string): Buffer {
  const hdr = Buffer.concat([
    u32le(0xa1b2c3d4), u16le(2), u16le(4),
    u32le(0), u32le(0), u32le(65535), u32le(1),
  ]);

  const C = '192.168.1.12', S = '192.168.1.1', CP = 52841, SP = 80;
  const BASE = 1700000000;
  const SESSION = 'eyJ1c2VyIjoiai5oZW5kZXJzb24ifQ==';

  const f1 = frame(C, S, CP, SP, 0, 0, 0x02);
  const f2 = frame(S, C, SP, CP, 0, 1, 0x12);
  const f3 = frame(C, S, CP, SP, 1, 1, 0x10);

  const postBody = 'username=j.henderson&password=Henderson@2024!';
  const postReq  = Buffer.from(
    `POST /portal/auth/login HTTP/1.1\r\nHost: ${S}\r\n` +
    `Content-Type: application/x-www-form-urlencoded\r\n` +
    `Content-Length: ${postBody.length}\r\n` +
    `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n` +
    `Connection: keep-alive\r\n\r\n${postBody}`, 'ascii');
  const f4 = frame(C, S, CP, SP, 1, 1, 0x18, postReq);

  // ← FLAG embedded here
  const resp302 = Buffer.from(
    `HTTP/1.1 302 Found\r\nLocation: /portal/dashboard\r\n` +
    `X-Auth-Token: ${dynamicFlag}\r\n` +
    `Set-Cookie: session=${SESSION}; Path=/; HttpOnly\r\n` +
    `Cache-Control: no-store\r\nContent-Length: 0\r\n\r\n`, 'ascii');
  const f5 = frame(S, C, SP, CP, 1, postReq.length + 1, 0x18, resp302);

  const getReq = Buffer.from(
    `GET /portal/dashboard HTTP/1.1\r\nHost: ${S}\r\n` +
    `Cookie: session=${SESSION}\r\nConnection: keep-alive\r\n\r\n`, 'ascii');
  const f6 = frame(C, S, CP, SP, postReq.length + 1, resp302.length + 1, 0x18, getReq);

  const htmlBody = '<html><body><h1>Welcome, j.henderson</h1></body></html>';
  const resp200  = Buffer.from(
    `HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n` +
    `Content-Length: ${htmlBody.length}\r\n\r\n${htmlBody}`, 'ascii');
  const f7 = frame(S, C, SP, CP, resp302.length + 1, getReq.length + postReq.length + 1, 0x18, resp200);

  return Buffer.concat([
    hdr,
    pcapRec(f1, BASE,      0),
    pcapRec(f2, BASE,   8120),
    pcapRec(f3, BASE,  12040),
    pcapRec(f4, BASE,  19900),
    pcapRec(f5, BASE, 146000),
    pcapRec(f6, BASE, 151000),
    pcapRec(f7, BASE, 284000),
  ]);
}

// ─── Service ─────────────────────────────────────────────────────────────────────

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    // initializeState() resolves slug→UUID internally and returns the UUID
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(
      userId, result.labId, ATTEMPT_ID, result.dynamicFlag, 24,
    );
    return { status: 'success', message: 'Lab environment initialized', labId: result.labId };
  }

  // ──────────────────────────────────────────────────────────────────────
  /**
   * Simulated packet list for the in-browser Wireshark UI.
   *
   * KEY FIX: resolveLabId() is called once, producing the same UUID that
   * initializeState() used. generateDynamicFlag(prefix, userId, UUID) is
   * therefore always deterministic and matches what verifyAndConsume() checks.
   */
  async getCapture(userId: string, labId: string) {
    // ← resolve ONCE to UUID — this is the only labId passed forward
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

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
        no: 4, time: '0.001990',
        source: '192.168.1.12', destination: '192.168.1.1',
        protocol: 'HTTP', length: 312,
        info: 'POST /portal/auth/login HTTP/1.1',
        httpData: {
          method: 'POST', uri: '/portal/auth/login', version: 'HTTP/1.1',
          headers: {
            Host: '192.168.1.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '44',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            Connection: 'keep-alive',
          },
          body: 'username=j.henderson&password=Henderson@2024!',
        },
      },
      {
        // ← FLAG lives here
        no: 5, time: '0.014600',
        source: '192.168.1.1', destination: '192.168.1.12',
        protocol: 'HTTP', length: 248,
        info: 'HTTP/1.1 302 Found',
        httpData: {
          status: 302,
          headers: {
            Location: '/portal/dashboard',
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
          method: 'GET', uri: '/portal/dashboard',
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
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '55' },
        },
      },
    ];

    return {
      packets,
      downloadUrl: `/practice-labs/wireshark/lab1/download?labId=${resolvedLabId}`,
      fileName: PCAP_FILE,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  /**
   * Stream a dynamically generated .pcap to the client.
   *
   * Built in-memory on every request — no static file required on disk.
   * Passes the SAME resolvedLabId (UUID) to generateDynamicFlag() that
   * initLab() used, guaranteeing the embedded flag matches the DB record.
   */
  async streamPcap(userId: string, labId: string, res: Response) {
    // ← same resolution path as getCapture — same UUID — same flag
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    const pcapBuffer = buildPcap(dynamicFlag);

    res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
    res.setHeader('Content-Disposition', `attachment; filename="${PCAP_FILE}"`);
    res.setHeader('Content-Length', pcapBuffer.length);
    res.end(pcapBuffer);
  }

  // ──────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────
  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const result = await this.flagRecord.verifyAndConsume(
      userId, resolvedLabId, ATTEMPT_ID, submittedFlag.trim(),
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
