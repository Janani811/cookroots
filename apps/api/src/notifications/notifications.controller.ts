import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findForUser(@Req() req: { userId: string }) {
    return this.notificationsService.findForUser(req.userId);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: { userId: string }) {
    const count = await this.notificationsService.unreadCount(req.userId);
    return { count };
  }

  @Patch('read-all')
  markAllRead(@Req() req: { userId: string }) {
    return this.notificationsService.markAllRead(req.userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: { userId: string }) {
    return this.notificationsService.markRead(id, req.userId);
  }
}
