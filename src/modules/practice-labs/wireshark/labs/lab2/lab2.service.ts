// src/modules/practice-labs/wireshark/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getChallenge(userId: string, labId: string) {
    // Simulated TCP stream reassembly challenge
    const tcpStream = [
      { seq: 1, payload: 'SFRMUC8xLjEgMjAwIE9L' },   // Base64: HTTP/1.1 200 OK
      { seq: 2, payload: 'Q29udGVudC1UeXBlOiB0ZXh0L2h0bWw=' }, // Content-Type: text/html
      { seq: 3, payload: 'PGJCR0tTPXtXSVJFU0hBUktfVENQX1NUUkVBTV9SRUFTU0VNQkxZfQ==' }, // <b>FLAG{WIRESHARK_TCP_STREAM_REASSEMBLY}</b>
    ];

    return {
      challenge: {
        description:
          'You captured fragmented TCP stream segments. Reassemble them in order and decode the payload.',
        stream: tcpStream,
        hint: 'Each payload is Base64-encoded. Decode them in sequence order to reconstruct the HTTP response.',
      },
      instructions:
        'Decode each Base64 payload in sequence order to reassemble the TCP stream. ' +
        'Find the flag hidden in the reassembled data. Submit as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{WIRESHARK_TCP_STREAM_REASSEMBLY}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Decode all 3 Base64 segments in order — the flag is in segment 3.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Excellent! You successfully reassembled the TCP stream and found the flag.',
      explanation:
        'Wireshark\'s "Follow TCP Stream" feature does exactly this — it reassembles fragmented ' +
        'TCP packets into a readable conversation. This is essential for network forensics.',
    };
  }
}
