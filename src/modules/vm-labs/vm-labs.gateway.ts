// src/modules/vm-labs/vm-labs.gateway.ts
// ─── WebSocket Gateway — relays real-time events from vm-service to the browser ───
//
// Flow:
//   Student browser  ──WS──►  cyberlabs-backend (this gateway)
//   cyberlabs-backend ─push─►  browser (instanceId rooms)
//
// The vm-service pushes WS events directly to cyberlabs-frontend-labs via a
// SEPARATE connection (vm-service → frontend). This gateway handles the case
// where the frontend is configured to connect to cyberlabs-backend instead.
//
// Auth:
//   - JWT token extracted from query param `?token=<jwt>` on WS handshake.
//   - Falls back to Authorization header for non-browser clients.
//   - Unauthenticated connections are immediately closed.
//
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface WsClient extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/vm-labs',
  cors: {
    origin:      (process.env.LABS_FRONTEND_URL ?? '*').split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class VmLabsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() private readonly server: Server;
  private readonly logger = new Logger(VmLabsGateway.name);

  constructor(private readonly jwt: JwtService) {}

  // ── On connect: authenticate + join instance room ──────────────────────
  async handleConnection(client: WsClient) {
    const token =
      (client.handshake.query['token'] as string | undefined) ??
      client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`[WS] Rejected unauthenticated connection ${client.id}`);
      client.emit('error', { message: 'No auth token provided' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
      client.userId = payload.sub;

      const instanceId = client.handshake.query['instanceId'] as string | undefined;
      if (instanceId) {
        await client.join(`instance:${instanceId}`);
        this.logger.log(`[WS] User ${client.userId} joined room instance:${instanceId}`);
      }
    } catch {
      this.logger.warn(`[WS] Rejected invalid token from ${client.id}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: WsClient) {
    this.logger.log(`[WS] Client disconnected: ${client.id} (user=${client.userId ?? 'anon'})`);
  }

  // ── Subscribe to an instance room (client-initiated join) ──────────────
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody()  data:   { instanceId: string },
    @ConnectedSocket() client: WsClient,
  ) {
    if (!client.userId) return;
    await client.join(`instance:${data.instanceId}`);
    client.emit('subscribed', { instanceId: data.instanceId });
    this.logger.log(
      `[WS] User ${client.userId} subscribed to instance:${data.instanceId}`,
    );
  }

  // ── Push helpers (called by other services) ─────────────────────────────

  /** Emit a VmLabWsEvent to all clients watching this instance */
  emitToInstance(instanceId: string, event: Record<string, unknown>) {
    this.server.to(`instance:${instanceId}`).emit('lab_event', event);
  }

  provisioning(instanceId: string) {
    this.emitToInstance(instanceId, { type: 'PROVISIONING', instanceId });
  }

  running(instanceId: string, accessUrl: string, secondsRemaining: number) {
    this.emitToInstance(instanceId, {
      type: 'RUNNING',
      instanceId,
      accessUrl,
      secondsRemaining,
    });
  }

  ttlUpdate(instanceId: string, secondsRemaining: number) {
    this.emitToInstance(instanceId, { type: 'TTL_UPDATE', instanceId, secondsRemaining });
  }

  expired(instanceId: string) {
    this.emitToInstance(instanceId, { type: 'EXPIRED', instanceId });
  }

  stopped(instanceId: string) {
    this.emitToInstance(instanceId, { type: 'STOPPED', instanceId });
  }

  error(instanceId: string, message: string) {
    this.emitToInstance(instanceId, { type: 'ERROR', instanceId, message });
  }

  flagResult(instanceId: string, correct: boolean, finalScore?: number) {
    this.emitToInstance(instanceId, {
      type:       'FLAG_RESULT',
      instanceId,
      flagCorrect: correct,
      finalScore,
    });
  }
}
