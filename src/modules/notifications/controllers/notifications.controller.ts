import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { NotificationsService } from '../services/notifications.service';
import { GetNotificationsDto } from '../dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/v1/notifications?tab=inbox|archived&page=1&limit=20 */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: GetNotificationsDto,
  ) {
    return {
      success: true,
      data: await this.notificationsService.getNotifications(userId, query),
    };
  }

  /** PATCH /api/v1/notifications/read-all */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  /** PATCH /api/v1/notifications/:id/read */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  /** PATCH /api/v1/notifications/:id/archive */
  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.archive(userId, notificationId);
  }
  /** DELETE /api/v1/notifications/all */
  @Delete('all')
  @HttpCode(HttpStatus.OK)
  async clearAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearAll(userId);
  }

  /** DELETE /api/v1/notifications/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOne(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.deleteOne(userId, notificationId);
  }
}
