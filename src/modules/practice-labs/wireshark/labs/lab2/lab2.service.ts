// src/modules/practice-labs/wireshark/labs/lab2/lab2.service.ts
// LAB 2 — TCP Stream Reassembly
// Scenario: Internal API responds with sensitive config over plain HTTP.
// Flag is Base64-encoded inside a JSON field in the HTTP response body.
// Student must inspect the response packet, read the JSON, decode session_data.
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB2-TCP-STREAM';

@Injectable()
export class Lab2Service {
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
      'lab2-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'Lab environment initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // Flag hidden inside Base64-encoded session_data field of the JSON response body
    const sessionData = Buffer.from(dynamicFlag).toString('base64');

    const packets = [
      {
        no: 1,
        time: '0.000000',
        source: '10.10.0.22',
        destination: '10.10.0.5',
        protocol: 'TCP',
        length: 74,
        info: '58142 → 8080 [SYN] Seq=0 Win=64240 Len=0',
        tcpStream: 0,
      },
      {
        no: 2,
        time: '0.000620',
        source: '10.10.0.5',
        destination: '10.10.0.22',
        protocol: 'TCP',
        length: 74,
        info: '8080 → 58142 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0',
        tcpStream: 0,
      },
      {
        no: 3,
        time: '0.001100',
        source: '10.10.0.22',
        destination: '10.10.0.5',
        protocol: 'TCP',
        length: 66,
        info: '58142 → 8080 [ACK] Seq=1 Ack=1 Win=64240 Len=0',
        tcpStream: 0,
      },
      {
        no: 4,
        time: '0.001830',
        source: '10.10.0.22',
        destination: '10.10.0.5',
        protocol: 'HTTP',
        length: 286,
        info: 'GET /api/internal/health-config HTTP/1.1',
        tcpStream: 0,
        httpData: {
          method: 'GET',
          uri: '/api/internal/health-config',
          version: 'HTTP/1.1',
          headers: {
            Host: '10.10.0.5:8080',
            Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiZGV2LXdvcmtlciIsInJvbGUiOiJpbnRlcm5hbCJ9.',
            'X-Request-ID': '4f2a8c1d-b3e7-4a90-9f1c-2d5e8b3a7c4f',
            'User-Agent': 'health-monitor/2.1.0',
          },
        },
      },
      {
        no: 5,
        time: '0.018400',
        source: '10.10.0.5',
        destination: '10.10.0.22',
        protocol: 'HTTP',
        length: 744,
        info: 'HTTP/1.1 200 OK (application/json)',
        tcpStream: 0,
        httpData: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Powered-By': 'Express',
            'Cache-Control': 'no-store',
          },
          // Flag hidden as Base64 in session_data — student must decode it
          body: JSON.stringify({
            status: 'healthy',
            env: 'staging',
            db_host: 'db-primary.internal:5432',
            db_user: 'app_readwrite',
            cache_ttl: 300,
            session_data: sessionData,
            debug: true,
            build: '20240315-a4f2',
          }),
        },
      },
      {
        no: 6,
        time: '0.018900',
        source: '10.10.0.22',
        destination: '10.10.0.5',
        protocol: 'TCP',
        length: 66,
        info: '58142 → 8080 [ACK] Seq=235 Ack=679 Win=63562 Len=0',
        tcpStream: 0,
      },
      {
        no: 7,
        time: '0.019200',
        source: '10.10.0.22',
        destination: '10.10.0.5',
        protocol: 'TCP',
        length: 66,
        info: '58142 → 8080 [FIN, ACK] Seq=235 Ack=679 Win=63562 Len=0',
        tcpStream: 0,
      },
      {
        no: 8,
        time: '0.019800',
        source: '10.10.0.5',
        destination: '10.10.0.22',
        protocol: 'TCP',
        length: 66,
        info: '8080 → 58142 [FIN, ACK] Seq=679 Ack=236 Win=65535 Len=0',
        tcpStream: 0,
      },
    ];

    return { packets };
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
      userId,
      resolvedLabId,
      'lab2-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success: true,
        flag: submittedFlag.trim(),
        message: 'Access confirmed.',
        explanation:
          'An internal API endpoint exposed sensitive configuration including a Base64-encoded ' +
          'session token over unencrypted HTTP. ' +
          'Base64 is encoding, not encryption — anyone who captures the packet can decode it trivially.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Already submitted.' };
    if (result === 'expired') return { success: false, message: 'Session expired. Restart lab.' };

    return { success: false, message: 'Incorrect flag.' };
  }
}
