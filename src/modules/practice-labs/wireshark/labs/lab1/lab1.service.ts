// src/modules/practice-labs/wireshark/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

// Flag prefix ثابت مرتبط بالـ slug
const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB1-HTTP-CREDENTIALS';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  // ─── initLab ───────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);

    // احفظ الـ dynamic flag في الـ FlagRecord عشان يتحقق منه عند الـ submit
    await this.flagRecord.generateAndStore(
      userId,
      result.labId,
      'lab1-attempt',
      result.dynamicFlag,
      24,
    );

    return { status: 'success', message: 'Lab environment initialized', labId: result.labId };
  }

  // ─── getCapture ────────────────────────────────────────────────────────────
  // يرجع simulated HTTP traffic مع الـ dynamic flag مدمج في الـ packet
  async getCapture(userId: string, labId: string) {
    // resolve الـ labId الحقيقي من الـ DB
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    // ولّد الـ dynamic flag الخاص بالـ user
    const dynamicFlag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    const packets = [
      {
        no: 1,
        time: '0.000000',
        source: '192.168.1.5',
        destination: '192.168.1.1',
        protocol: 'TCP',
        info: '54321 → 80 [SYN]',
      },
      {
        no: 2,
        time: '0.001200',
        source: '192.168.1.1',
        destination: '192.168.1.5',
        protocol: 'TCP',
        info: '80 → 54321 [SYN, ACK]',
      },
      {
        no: 3,
        time: '0.002100',
        source: '192.168.1.5',
        destination: '192.168.1.1',
        protocol: 'HTTP',
        info: 'POST /login HTTP/1.1',
        httpData: {
          method: 'POST',
          uri: '/login',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Host: '192.168.1.1',
          },
          // الـ dynamic flag موجود في الـ body للـ POST request
          body: `username=admin&password=${dynamicFlag}}`,
        },
      },
      {
        no: 4,
        time: '0.015000',
        source: '192.168.1.1',
        destination: '192.168.1.5',
        protocol: 'HTTP',
        info: 'HTTP/1.1 200 OK',
        httpData: { status: 200, body: '{"message":"Login successful"}' },
      },
    ];

    return { packets };
  }

  // ─── submitFlag ────────────────────────────────────────────────────────────
  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);

    const result = await this.flagRecord.verifyAndConsume(
      userId,
      resolvedLabId,
      'lab1-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success: true,
        flag: submittedFlag.trim(),
        message: 'Correct! You found the credentials exposed in plain HTTP traffic.',
        explanation:
          'HTTP (not HTTPS) transmits data in plaintext. Anyone on the same network ' +
          'can capture login credentials using tools like Wireshark. Always use HTTPS.',
      };
    }

    if (result === 'already_used') {
      return { success: false, message: 'Flag already submitted. Well done — lab is solved!' };
    }

    if (result === 'expired') {
      return { success: false, message: 'Session expired. Please restart the lab.' };
    }

    return {
      success: false,
      message: 'Incorrect. Look at packet #3 — expand the HTTP POST body.',
    };
  }
}
