// src/modules/practice-labs/csrf/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async getBalance(userId: string, labId: string) {
    const wallets = await this.prisma.labGenericBank.findMany({
      where: { userId, labId },
    });

    return {
      success: true,
      wallets: wallets.map((w) => ({
        accountNo: w.accountNo,
        balance: w.balance,
        owner: w.ownerName,
      })),
    };
  }

  // ❌ الثغرة: يقبل form-encoded + بدون CSRF token + بدون Origin check
  async transfer(
    userId: string,
    labId: string,
    toAccount: string,
    amount: number,
    contentType?: string,
    origin?: string,
  ) {
    if (!toAccount || !amount) {
      throw new BadRequestException('toAccount and amount are required');
    }
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const senderWallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'VICTIM-ACC' },
    });

    if (!senderWallet) throw new NotFoundException('Victim wallet not found');

    const receiverWallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: toAccount },
    });

    if (!receiverWallet)
      throw new NotFoundException('Receiver wallet not found');

    if (senderWallet.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    await this.prisma.labGenericBank.update({
      where: { id: senderWallet.id },
      data: { balance: senderWallet.balance - amount },
    });

    await this.prisma.labGenericBank.update({
      where: { id: receiverWallet.id },
      data: { balance: receiverWallet.balance + amount },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CSRF',
        action: 'FUND_TRANSFER',
        meta: {
          from: 'VICTIM-ACC',
          to: toAccount,
          amount,
          contentType: contentType || 'unknown',
          origin: origin || 'none',
        },
      },
    });

    // ❌ الثغرة: يقبل form-encoded كـ JSON
    const isFormEncoded = contentType?.includes('x-www-form-urlencoded');
    const isCrossOrigin = !origin || !origin.includes('payswift');
    const isExploited =
      toAccount === 'ATTACKER-ACC' && (isFormEncoded || isCrossOrigin);

    const updatedReceiver = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: toAccount },
    });

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        transfer: { from: 'VICTIM-ACC', to: toAccount, amount },
        attackerNewBalance: updatedReceiver?.balance,
        flag: 'FLAG{CSRF_JSON_API_CONTENT_TYPE_BYPASS_FUND_TRANSFER}',
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

    return {
      success: true,
      transfer: {
        from: 'VICTIM-ACC',
        to: toAccount,
        amount,
        status: 'SUCCESS',
      },
    };
  }

  async simulateVictim(
    userId: string,
    labId: string,
    toAccount: string,
    amount: number,
  ) {
    return this.transfer(
      userId,
      labId,
      toAccount,
      amount,
      'application/x-www-form-urlencoded', // ❌ form-encoded
      'https://evil-site.com', // ❌ cross-origin
    );
  }
}
