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
import { Logger, UseGuards } from '@nestjs/common';

/**
 * VmLabsGateway — real-time status push to the frontend.
 *
 * Clients JOIN a room named after their instanceId:
 *   socket.emit('vm:join', { instanceId })
 *
 * Server pushes status updates:
 *   'vm:status' → { instanceId, status, expiresAt }
 *   'vm:flag_result' → { correct, message }
 *   'vm:hint_unlocked' → { hintIndex, hint, newScore }
 *
 * In production wire this to Redis pub/sub so it scales
 * across multiple NestJS replicas.
 */
@WebSocketGateway({
  namespace: 'vm-labs',
  cors: { origin: '*' }, // lock down to your frontend origin in production
})
export class VmLabsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VmLabsGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('vm:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { instanceId: string },
  ) {
    client.join(`instance:${data.instanceId}`);
    this.logger.debug(`Client ${client.id} joined room instance:${data.instanceId}`);
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

  /** Called by the orchestrator service to push status changes */
  pushStatusUpdate(instanceId: string, status: string, expiresAt?: Date) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:status', { instanceId, status, expiresAt });
  }

  pushFlagResult(instanceId: string, correct: boolean, message: string) {
    this.server.to(`instance:${instanceId}`).emit('vm:flag_result', { correct, message });
  }

  pushHintUnlocked(instanceId: string, hintIndex: number, hint: string, newScore: number) {
    this.server
      .to(`instance:${instanceId}`)
      .emit('vm:hint_unlocked', { hintIndex, hint, newScore });
  }
}
