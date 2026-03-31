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
// Flag sync guarantee:
//   Both the simulation (getCapture) and the downloadable PCAP (streamPcap)
//   read the flag from FlagRecordService.getStoredFlag() — the exact same
//   value that was stored at initLab() time and is used for verification.
//   This eliminates any mismatch between what the student sees and what the
//   server expects.
import { Injectable, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const ATTEMPT_ID  = 'lab1-attempt';
const PCAP_FILE   = 'lab1_http_creds.pcap';

// ─── PCAP builder ────────────────────────────────────────────────────────────────
//
// Builds a valid libpcap (little-endian) buffer in memory containing
// 7 hand-crafted Ethernet+IP+TCP (+HTTP payload) frames that mirror
// the packet list returned by getCapture().
//
// Frame layout:
//   1 – Client SYN
//   2 – Server SYN-ACK
//   3 – Client ACK
//   4 – Client HTTP POST (username=j.henderson&password=Henderson@2024!)
//   5 – Server HTTP 302  (X-Auth-Token: <dynamicFlag>)  ← FLAG IS HERE
//   6 – Client GET /portal/dashboard
//   7 – Server HTTP 200 OK
//
// The .pcap is intentionally minimal but fully parseable by Wireshark
// and tshark without warnings.

function buildU16LE(v: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(v, 0);
  return b;
}
function buildU32LE(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(v, 0);
  return b;
}

/** Minimal Internet Checksum (RFC 1071) */
function checksum(buf: Buffer): number {
  let sum = 0;
  for (let i = 0; i < buf.length - 1; i += 2) sum += buf.readUInt16BE(i);
  if (buf.length % 2) sum += buf[buf.length - 1] << 8;
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
  return ~sum & 0xffff;
}

/**
 * Build a complete Ethernet II + IPv4 + TCP frame.
 * @param srcIp   source IPv4 as dotted-decimal
 * @param dstIp   destination IPv4
 * @param srcPort TCP source port
 * @param dstPort TCP destination port
 * @param seq     TCP sequence number
 * @param ack     TCP acknowledgement number
 * @param flags   TCP flags byte (e.g. 0x02=SYN, 0x12=SYN+ACK, 0x10=ACK, 0x18=PSH+ACK)
 * @param payload TCP payload (application data)
 */
function buildFrame(
  srcIp: string,
  dstIp: string,
  srcPort: number,
  dstPort: number,
  seq: number,
  ack: number,
  flags: number,
  payload: Buffer = Buffer.alloc(0),
): Buffer {
  // ─ Ethernet header (14 bytes) ─
  // src MAC: aa:bb:cc:dd:ee:ff  dst MAC: 11:22:33:44:55:66  EtherType: 0x0800 (IPv4)
  const eth = Buffer.from([0x11,0x22,0x33,0x44,0x55,0x66, 0xaa,0xbb,0xcc,0xdd,0xee,0xff, 0x08,0x00]);

  // ─ IPv4 header (20 bytes, no options) ─
  const totalLen = 20 + 20 + payload.length;
  const ipBuf = Buffer.alloc(20, 0);
  ipBuf[0]  = 0x45;                          // version=4, IHL=5
  ipBuf[1]  = 0x00;                          // DSCP/ECN
  ipBuf.writeUInt16BE(totalLen, 2);           // Total Length
  ipBuf.writeUInt16BE(0xabcd, 4);            // Identification
  ipBuf.writeUInt16BE(0x4000, 6);            // Flags=DF, Fragment Offset=0
  ipBuf[8]  = 64;                            // TTL
  ipBuf[9]  = 6;                             // Protocol=TCP
  // checksum placeholder 0x0000 at bytes 10-11
  srcIp.split('.').forEach((o, i) => { ipBuf[12 + i] = parseInt(o, 10); });
  dstIp.split('.').forEach((o, i) => { ipBuf[16 + i] = parseInt(o, 10); });
  const ipCsum = checksum(ipBuf);
  ipBuf.writeUInt16BE(ipCsum, 10);

  // ─ TCP header (20 bytes, no options) ─
  const tcpBuf = Buffer.alloc(20, 0);
  tcpBuf.writeUInt16BE(srcPort, 0);
  tcpBuf.writeUInt16BE(dstPort, 2);
  tcpBuf.writeUInt32BE(seq,      4);
  tcpBuf.writeUInt32BE(ack,      8);
  tcpBuf[12] = 0x50;                         // Data offset=5 (20 bytes), reserved=0
  tcpBuf[13] = flags;
  tcpBuf.writeUInt16BE(64240, 14);           // Window size
  // checksum computed via pseudo-header
  const pseudoHeader = Buffer.alloc(12);
  srcIp.split('.').forEach((o, i) => { pseudoHeader[i] = parseInt(o, 10); });
  dstIp.split('.').forEach((o, i) => { pseudoHeader[4 + i] = parseInt(o, 10); });
  pseudoHeader[9]  = 6;                      // Protocol=TCP
  pseudoHeader.writeUInt16BE(20 + payload.length, 10);
  const tcpCsumBuf = Buffer.concat([pseudoHeader, tcpBuf, payload]);
  tcpBuf.writeUInt16BE(checksum(tcpCsumBuf), 16);

  return Buffer.concat([eth, ipBuf, tcpBuf, payload]);
}

/** Wrap a frame in a libpcap record header (16 bytes). */
function pcapRecord(frame: Buffer, ts_sec: number, ts_usec: number): Buffer {
  const hdr = Buffer.alloc(16);
  hdr.writeUInt32LE(ts_sec,        0);
  hdr.writeUInt32LE(ts_usec,       4);
  hdr.writeUInt32LE(frame.length,  8);   // captured length
  hdr.writeUInt32LE(frame.length, 12);   // original length
  return Buffer.concat([hdr, frame]);
}

/**
 * Build a complete libpcap file buffer containing all 7 frames.
 * The dynamic flag is embedded in the X-Auth-Token response header of frame 5.
 */
function buildPcap(dynamicFlag: string): Buffer {
  // ─ Global header (24 bytes) ─
  const globalHeader = Buffer.concat([
    buildU32LE(0xa1b2c3d4),   // magic number (little-endian timestamps)
    buildU16LE(2),             // major version
    buildU16LE(4),             // minor version
    buildU32LE(0),             // GMT offset
    buildU32LE(0),             // timestamp accuracy
    buildU32LE(65535),         // snapshot length
    buildU32LE(1),             // link-layer type: Ethernet
  ]);

  const CLIENT = '192.168.1.12';
  const SERVER = '192.168.1.1';
  const CPORT  = 52841;
  const SPORT  = 80;

  // Frame 1 – SYN
  const f1 = buildFrame(CLIENT, SERVER, CPORT, SPORT, 0, 0, 0x02);
  // Frame 2 – SYN-ACK
  const f2 = buildFrame(SERVER, CLIENT, SPORT, CPORT, 0, 1, 0x12);
  // Frame 3 – ACK
  const f3 = buildFrame(CLIENT, SERVER, CPORT, SPORT, 1, 1, 0x10);

  // Frame 4 – HTTP POST
  const postBody   = 'username=j.henderson&password=Henderson@2024!';
  const postReq    =
    `POST /portal/auth/login HTTP/1.1\r\n` +
    `Host: 192.168.1.1\r\n` +
    `Content-Type: application/x-www-form-urlencoded\r\n` +
    `Content-Length: ${postBody.length}\r\n` +
    `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n` +
    `Connection: keep-alive\r\n` +
    `\r\n` +
    postBody;
  const f4 = buildFrame(CLIENT, SERVER, CPORT, SPORT, 1, 1, 0x18, Buffer.from(postReq, 'ascii'));

  // Frame 5 – HTTP 302 (FLAG in X-Auth-Token)
  const sessionCookie = 'eyJ1c2VyIjoiai5oZW5kZXJzb24ifQ==';
  const resp302 =
    `HTTP/1.1 302 Found\r\n` +
    `Location: /portal/dashboard\r\n` +
    `X-Auth-Token: ${dynamicFlag}\r\n` +
    `Set-Cookie: session=${sessionCookie}; Path=/; HttpOnly\r\n` +
    `Cache-Control: no-store\r\n` +
    `Content-Length: 0\r\n` +
    `\r\n`;
  const f5 = buildFrame(SERVER, CLIENT, SPORT, CPORT, 1, f4.length - 54 + 1, 0x18, Buffer.from(resp302, 'ascii'));

  // Frame 6 – GET /portal/dashboard
  const getReq =
    `GET /portal/dashboard HTTP/1.1\r\n` +
    `Host: 192.168.1.1\r\n` +
    `Cookie: session=${sessionCookie}\r\n` +
    `Connection: keep-alive\r\n` +
    `\r\n`;
  const f6 = buildFrame(CLIENT, SERVER, CPORT, SPORT, f4.length - 54 + 1, resp302.length + 1, 0x18, Buffer.from(getReq, 'ascii'));

  // Frame 7 – HTTP 200 OK
  const htmlBody = '<html><body><h1>Welcome, j.henderson</h1></body></html>';
  const resp200  =
    `HTTP/1.1 200 OK\r\n` +
    `Content-Type: text/html; charset=utf-8\r\n` +
    `Content-Length: ${htmlBody.length}\r\n` +
    `\r\n` +
    htmlBody;
  const f7 = buildFrame(SERVER, CLIENT, SPORT, CPORT, resp302.length + 1, getReq.length + f4.length - 54 + 1, 0x18, Buffer.from(resp200, 'ascii'));

  // Timestamps (base: epoch 1700000000 ≈ Nov 2023)
  const BASE = 1700000000;
  const records = Buffer.concat([
    pcapRecord(f1,      BASE,       0),
    pcapRecord(f2,      BASE,    8120),
    pcapRecord(f3,      BASE,   12040),
    pcapRecord(f4,      BASE,   19900),
    pcapRecord(f5,      BASE,  146000),
    pcapRecord(f6,      BASE,  151000),
    pcapRecord(f7,      BASE,  284000),
  ]);

  return Buffer.concat([globalHeader, records]);
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
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(
      userId, result.labId, ATTEMPT_ID, result.dynamicFlag, 24,
    );
    return { status: 'success', message: 'Lab environment initialized', labId: result.labId };
  }

  // ──────────────────────────────────────────────────────────────────────
  /**
   * Returns the simulated packet list for the in-browser Wireshark UI.
   * The dynamic flag is read from the DB (stored at initLab time) so it
   * is always identical to what verifyAndConsume() will check.
   */
  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    // ← Single source of truth: read from DB, never re-generate
    const dynamicFlag = await this.flagRecord.getStoredFlag(userId, resolvedLabId, ATTEMPT_ID);
    if (!dynamicFlag) {
      throw new BadRequestException(
        'Lab session not found or expired. Please click “Start Lab” first.',
      );
    }

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
          method: 'POST',
          uri: '/portal/auth/login',
          version: 'HTTP/1.1',
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
        // ← FLAG is here: X-Auth-Token response header
        no: 5, time: '0.014600',
        source: '192.168.1.1', destination: '192.168.1.12',
        protocol: 'HTTP', length: 248,
        info: 'HTTP/1.1 302 Found',
        httpData: {
          status: 302,
          headers: {
            Location: '/portal/dashboard',
            'X-Auth-Token': dynamicFlag,   // ← from DB — always correct
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
            'Content-Length': '55',
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

  // ──────────────────────────────────────────────────────────────────────
  /**
   * Stream a dynamically generated .pcap file to the client.
   *
   * The PCAP is built in memory on every request using the stored flag
   * from the DB — no static file on disk is required. The generated
   * file is fully parseable by Wireshark and tshark.
   *
   * Frame 5 of the PCAP contains the same dynamic flag as the simulation
   * inside the HTTP/1.1 302 response's X-Auth-Token header.
   */
  async streamPcap(userId: string, labId: string, res: Response) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    // Read the stored flag — same source of truth as getCapture()
    const dynamicFlag = await this.flagRecord.getStoredFlag(userId, resolvedLabId, ATTEMPT_ID);
    if (!dynamicFlag) {
      throw new BadRequestException(
        'Lab session not found or expired. Please click “Start Lab” first.',
      );
    }

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
