import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminGuard } from '../../common/guards';

@UseGuards(AdminGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly svc: AdminNotificationsService) {}

  /** POST /admin/notifications/broadcast */
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  broadcast(
    @Body() dto: { title: string; message: string; type?: string },
    @Request() req: any,
  ) {
    return this.svc.broadcast(dto, req.user);
  }

  /** GET /admin/notifications/history */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  getHistory(@Query() query: { page?: string; limit?: string }) {
    return this.svc.getHistory(query);
  }
}
