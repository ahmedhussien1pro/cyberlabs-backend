// src/modules/practice-labs/wireshark/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // يرجع simulated HTTP traffic بدل pcap حقيقي (للتبسيط)
  async getChallenge(userId: string, labId: string) {
    // Simulated captured HTTP packets
    const capturedPackets = [
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
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Host: '192.168.1.1' },
          body: 'username=admin&password=FLAG{WIRESHARK_HTTP_CREDS_EXPOSED}',
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

    return {
      challenge: {
        description:
          'You captured network traffic between a client and a server. ' +
          'Analyze the packets and find the credentials submitted in the HTTP request.',
        packets: capturedPackets,
        hint: 'Look for HTTP POST requests — they often contain form data in plaintext.',
      },
      instructions:
        'Examine the packet capture above. Find the login credentials in the HTTP POST request. ' +
        'The password is the flag. Submit as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{WIRESHARK_HTTP_CREDS_EXPOSED}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Look at packet #3 — the HTTP POST body.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Correct! You found the credentials exposed in plain HTTP traffic.',
      explanation:
        'HTTP (not HTTPS) transmits data in plaintext. Anyone on the same network can capture ' +
        'login credentials using tools like Wireshark. Always use HTTPS.',
    };
  }
}
