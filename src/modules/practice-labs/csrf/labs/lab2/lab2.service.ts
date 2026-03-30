// src/modules/practice-labs/csrf/labs/lab2/lab2.service.ts
// Refactored (PR #3):
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - Exploit condition → CsrfDetectorEngine.jsonApiContentTypeBypass()
//  - FlagRecordService wired in

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { CsrfDetectorEngine } from '../../../shared/engines/csrf-detector.engine';

const LAB_SECRET   = 'csrf_lab2_json_api_contenttype_payswift_2025';
const FLAG_PREFIX  = 'CSRF_LAB2';
const TRUSTED_DOMAIN = 'payswift';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, labId, 'attempt-1', flag);
    return state;
  }

  async getBalance(userId: string, labId: string) {
    const wallets = await this.prisma.labGenericBank.findMany({ where: { userId, labId } });
    return {
      success: true,
      wallets: wallets.map((w) => ({ accountNo: w.accountNo, balance: w.balance, owner: w.ownerName })),
    };
  }

  async transfer(
    userId: string, labId: string, toAccount: string, amount: number,
    contentType?: string, origin?: string,
  ) {
    if (!toAccount || !amount) throw new BadRequestException('toAccount and amount are required');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const senderWallet = await this.prisma.labGenericBank.findFirst({ where: { userId, labId, accountNo: 'VICTIM-ACC' } });
    if (!senderWallet) throw new NotFoundException('Victim wallet not found');

    const receiverWallet = await this.prisma.labGenericBank.findFirst({ where: { userId, labId, accountNo: toAccount } });
    if (!receiverWallet) throw new NotFoundException('Receiver wallet not found');
    if (senderWallet.balance < amount) throw new BadRequestException('Insufficient funds');

    await this.prisma.labGenericBank.update({ where: { id: senderWallet.id }, data: { balance: senderWallet.balance - amount } });
    await this.prisma.labGenericBank.update({ where: { id: receiverWallet.id }, data: { balance: receiverWallet.balance + amount } });

    await this.prisma.labGenericLog.create({
      data: {
        userId, labId, type: 'CSRF', action: 'FUND_TRANSFER',
        meta: { from: 'VICTIM-ACC', to: toAccount, amount, contentType: contentType || 'unknown', origin: origin || 'none' },
      },
    });

    const { exploited, reason } = CsrfDetectorEngine.jsonApiContentTypeBypass({
      origin, contentType, trustedDomain: TRUSTED_DOMAIN,
    });

    const updatedReceiver = await this.prisma.labGenericBank.findFirst({ where: { userId, labId, accountNo: toAccount } });

    if (exploited && toAccount === 'ATTACKER-ACC') {
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        transfer: { from: 'VICTIM-ACC', to: toAccount, amount },
        attackerNewBalance: updatedReceiver?.balance,
        exploitReason: reason,
        flag,
        vulnerability: 'CSRF — JSON API Content-Type Bypass',
        impact: `$${amount} transferred from victim's account silently. The developer assumed "JSON-only API = CSRF-safe" — this is WRONG.`,
        fix: [
          'Implement CSRF tokens even on JSON APIs',
          'Strictly enforce Content-Type: application/json — reject form-encoded',
          'Validate Origin header: reject if not in whitelist',
          'Use SameSite=Strict on session cookies',
        ],
      };
    }

    return { success: true, transfer: { from: 'VICTIM-ACC', to: toAccount, amount, status: 'SUCCESS' } };
  }

  async simulateVictim(userId: string, labId: string, toAccount: string, amount: number) {
    return this.transfer(userId, labId, toAccount, amount, 'application/x-www-form-urlencoded', 'https://evil-site.com');
  }
}
