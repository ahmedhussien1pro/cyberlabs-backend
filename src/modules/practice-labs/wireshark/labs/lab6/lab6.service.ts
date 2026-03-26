// src/modules/practice-labs/wireshark/labs/lab6/lab6.service.ts
// LAB 6 — SQLi Hunt via HTTP Traffic (Intermediate)
// Scenario : WAF logs anomalous HTTP traffic. Attacker sends UNION SELECT payloads.
// الطالب يبني display filter صح، يحدد attacker IP والـ injected payload
// Flag     : FLAG{attacker_ip_payload_hash}
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB6-SQLI';

const ATTACKER_IP  = '192.168.1.105';
const VICTIM_IP    = '10.10.0.8';
const SERVER_IP    = '10.10.0.1';
const C2_IP        = '185.220.101.45';

@Injectable()
export class Lab6Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(
      userId,
      result.labId,
      'lab6-sqli-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'SQLi Hunt lab initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    const packets = [
      // Normal GET traffic
      { no: 1,  time: '0.000000', srcIp: VICTIM_IP,   dstIp: SERVER_IP, source: VICTIM_IP,   destination: SERVER_IP, protocol: 'HTTP', length: 280,
        info: 'GET /index.php HTTP/1.1',
        httpData: { method: 'GET', uri: '/index.php', statusCode: null, sqli: false } },
      { no: 2,  time: '0.010000', srcIp: SERVER_IP,   dstIp: VICTIM_IP, source: SERVER_IP,   destination: VICTIM_IP, protocol: 'HTTP', length: 512,
        info: 'HTTP/1.1 200 OK',
        httpData: { method: null, uri: null, statusCode: 200, sqli: false } },
      { no: 3,  time: '0.020000', srcIp: VICTIM_IP,   dstIp: SERVER_IP, source: VICTIM_IP,   destination: SERVER_IP, protocol: 'HTTP', length: 295,
        info: 'GET /products.php?id=3 HTTP/1.1',
        httpData: { method: 'GET', uri: '/products.php?id=3', statusCode: null, sqli: false } },
      { no: 4,  time: '0.030000', srcIp: SERVER_IP,   dstIp: VICTIM_IP, source: SERVER_IP,   destination: VICTIM_IP, protocol: 'HTTP', length: 648,
        info: 'HTTP/1.1 200 OK',
        httpData: { method: null, uri: null, statusCode: 200, sqli: false } },
      // Normal TCP
      { no: 5,  time: '0.040000', srcIp: VICTIM_IP,   dstIp: SERVER_IP, source: VICTIM_IP,   destination: SERVER_IP, protocol: 'TCP', length: 60,
        info: '55301 → 80 [SYN]', flags: 'SYN' },
      { no: 6,  time: '0.041000', srcIp: SERVER_IP,   dstIp: VICTIM_IP, source: SERVER_IP,   destination: VICTIM_IP, protocol: 'TCP', length: 60,
        info: '80 → 55301 [SYN, ACK]', flags: 'SYN,ACK' },
      // ⚠️ SQLi Attempt 1 — Error-based
      { no: 7,  time: '1.500000', srcIp: ATTACKER_IP, dstIp: SERVER_IP, source: ATTACKER_IP, destination: SERVER_IP, protocol: 'HTTP', length: 342,
        info: "GET /products.php?id=1' HTTP/1.1",
        httpData: {
          method:    'GET',
          uri:       "/products.php?id=1'",
          statusCode: null,
          sqli:      true,
          payload:   "id=1'",
          note:      'Error-based SQLi probe — single quote to test for SQL errors',
          userAgent: 'sqlmap/1.7.2#stable (https://sqlmap.org)',
        },
      },
      { no: 8,  time: '1.501000', srcIp: SERVER_IP,   dstIp: ATTACKER_IP, source: SERVER_IP, destination: ATTACKER_IP, protocol: 'HTTP', length: 890,
        info: 'HTTP/1.1 500 Internal Server Error',
        httpData: { method: null, uri: null, statusCode: 500, sqli: false, note: 'SQL syntax error leaked — confirms injectable parameter' } },
      // ⚠️ SQLi Attempt 2 — UNION SELECT
      { no: 9,  time: '1.600000', srcIp: ATTACKER_IP, dstIp: SERVER_IP, source: ATTACKER_IP, destination: SERVER_IP, protocol: 'HTTP', length: 418,
        info: 'GET /products.php?id=1 UNION SELECT 1,2,3-- HTTP/1.1',
        httpData: {
          method:    'GET',
          uri:       '/products.php?id=1 UNION SELECT 1,2,3--',
          statusCode: null,
          sqli:      true,
          payload:   'UNION SELECT 1,2,3--',
          note:      'UNION SELECT to enumerate columns',
          userAgent: 'sqlmap/1.7.2#stable (https://sqlmap.org)',
        },
      },
      { no: 10, time: '1.601000', srcIp: SERVER_IP, dstIp: ATTACKER_IP, source: SERVER_IP, destination: ATTACKER_IP, protocol: 'HTTP', length: 720,
        info: 'HTTP/1.1 200 OK',
        httpData: { method: null, uri: null, statusCode: 200, sqli: false, note: 'Response reflects column count — 3 columns confirmed' } },
      // More normal traffic
      { no: 11, time: '2.000000', srcIp: VICTIM_IP, dstIp: SERVER_IP, source: VICTIM_IP, destination: SERVER_IP, protocol: 'HTTP', length: 280,
        info: 'GET /about.php HTTP/1.1',
        httpData: { method: 'GET', uri: '/about.php', statusCode: null, sqli: false } },
      // ⚠️ SQLi Attempt 3 — Database extraction
      { no: 12, time: '2.100000', srcIp: ATTACKER_IP, dstIp: SERVER_IP, source: ATTACKER_IP, destination: SERVER_IP, protocol: 'HTTP', length: 512,
        info: 'GET /products.php?id=1 UNION SELECT user(),database(),version()-- HTTP/1.1',
        httpData: {
          method:    'GET',
          uri:       '/products.php?id=1 UNION SELECT user(),database(),version()--',
          statusCode: null,
          sqli:      true,
          payload:   'UNION SELECT user(),database(),version()--',
          note:      `DB version & user leaked. Attacker IP: ${ATTACKER_IP}. Flag: ${dynamicFlag}`,
          userAgent: 'sqlmap/1.7.2#stable (https://sqlmap.org)',
          flag:       dynamicFlag,
        },
      },
      { no: 13, time: '2.101000', srcIp: SERVER_IP, dstIp: ATTACKER_IP, source: SERVER_IP, destination: ATTACKER_IP, protocol: 'HTTP', length: 840,
        info: 'HTTP/1.1 200 OK — DB info in response body',
        httpData: { method: null, uri: null, statusCode: 200, sqli: false } },
      // TCP filler
      { no: 14, time: '3.000000', srcIp: C2_IP, dstIp: SERVER_IP, source: C2_IP, destination: SERVER_IP, protocol: 'TCP', length: 60,
        info: '44321 → 80 [SYN]', flags: 'SYN' },
      { no: 15, time: '3.001000', srcIp: SERVER_IP, dstIp: C2_IP, source: SERVER_IP, destination: C2_IP, protocol: 'TCP', length: 60,
        info: '80 → 44321 [RST, ACK]', flags: 'RST,ACK' },
    ];

    return { packets, attackerIp: ATTACKER_IP };
  }

  async getProgress(userId: string, labId: string) {
    try {
      const resolvedLabId = await this.stateService.resolveLabId(labId);
      const progress = await this.prisma.userLabProgress.findFirst({
        where:  { userId, labId: resolvedLabId },
        select: { flagSubmitted: true, hintsUsed: true, startedAt: true, completedAt: true },
      });
      return {
        step:          progress?.flagSubmitted ? 'COMPLETED' : 'RUNNING',
        flagSubmitted: progress?.flagSubmitted ?? false,
        hintsUsed:     progress?.hintsUsed     ?? 0,
        startedAt:     progress?.startedAt     ?? null,
        completedAt:   progress?.completedAt   ?? null,
      };
    } catch {
      return { step: 'RUNNING', flagSubmitted: false, hintsUsed: 0 };
    }
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const result = await this.flagRecord.verifyAndConsume(
      userId,
      resolvedLabId,
      'lab6-sqli-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     'Excellent! You identified the SQL injection attack chain.',
        explanation: 'SQLmap probes inject payloads like UNION SELECT to enumerate database structure. ' +
          'Defenders detect SQLi via WAF logs (HTTP 500 errors, UNION/SELECT keywords in URIs), ' +
          'and slow query logs. Mitigation: parameterized queries, WAF, input validation.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: `Incorrect. Filter http.request, find the UNION SELECT packets from ${ATTACKER_IP}, and read the flag from packet #12 body.`,
    };
  }
}
