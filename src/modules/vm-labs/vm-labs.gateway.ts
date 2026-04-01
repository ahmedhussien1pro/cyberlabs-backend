import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * VmLabsGateway — real-time status push to frontend.
 *
 * Plan reference: Step 7 (WebSocket Gateway)
 *
 * Client joins a room per instance:
 *   socket.emit('vm:join', { instanceId })
 *
 * Server pushes:
 *   'vm:status'         → { instanceId, status, expiresAt? }
 *   'vm:expiry_warning' → { instanceId, minutesLeft }
 *   'vm:flag_result'    → { correct, message }
 *   'vm:hint_unlocked'  → { hintIndex, hint, newScore }
 *   'vm:error'          → { instanceId, message }
 *
 * Heartbeat: client sends 'vm:heartbeat' every 30s.
 *   - Updates VmLabSession.lastHeartbeatAt
 *   - If no heartbeat for 5 min → set PAUSED (handled by cleanup cron)
 */
@WebSocketGateway({
  namespace: 'vm-labs',
  cors: { origin: process.env.FRONTEND_ORIGIN ?? '*' },
})
export class VmLabsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VmLabsGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`[WS] Client disconnected: ${client.id}`);
  }

  // ── Client → Server events ──────────────────────────────────────────────

  @SubscribeMessage('vm:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { instanceId: string },
  ) {
    client.join(`instance:${data.instanceId}`);
    this.logger.debug(`[WS] ${client.id} joined room instance:${data.instanceId}`);
    return { joined: data.instanceId };
  }

  @SubscribeMessage('vm:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { instanceId: string },
  ) {
    client.leave(`instance:${data.instanceId}`);
    return { left: data.instanceId };
  }

  /**
   * [7.2] Heartbeat: client sends every 30s to keep session alive.
   * Updates lastHeartbeatAt on the active VmLabSession row.
   */
  @SubscribeMessage('vm:heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { instanceId: string; userId: string },
  ) {
    try {
      await this.prisma.vmLabSession.updateMany({
        where: {
          instanceId: data.instanceId,
          userId: data.userId,
          isActive: true,
        },
        data: { lastHeartbeatAt: new Date() },
      });
    } catch (err) {
      this.logger.warn(`[WS:Heartbeat] Failed for instance ${data.instanceId}: ${err}`);
    }
    return { ok: true };
  }

  @SubscribeMessage('vm:disconnect_instance')
  async handleExplicitDisconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { instanceId: string; userId: string },
  ) {
    client.leave(`instance:${data.instanceId}`);
    try {
      await this.prisma.vmLabSession.updateMany({
        where: { instanceId: data.instanceId, userId: data.userId, isActive: true },
        data: { isActive: false, disconnectedAt: new Date() },
      });
    } catch (err) {
      this.logger.warn(`[WS:Disconnect] Session update failed: ${err}`);
    }
    return { disconnected: data.instanceId };
  }

  // ── Server → Client push helpers (called from services/crons) ──────────

  pushStatusUpdate(instanceId: string, status: string, expiresAt?: Date) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:status', { instanceId, status, expiresAt });
  }

  /** [7.2] Sent by sendExpiryWarnings cron exactly at 10 min before expiry */
  pushExpiryWarning(instanceId: string, minutesLeft: number) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:expiry_warning', { instanceId, minutesLeft });
  }

  pushFlagResult(instanceId: string, correct: boolean, message: string) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:flag_result', { correct, message });
  }

  pushHintUnlocked(instanceId: string, hintIndex: number, hint: string, newScore: number) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:hint_unlocked', { hintIndex, hint, newScore });
  }

  pushError(instanceId: string, message: string) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:error', { instanceId, message });
  }
}
