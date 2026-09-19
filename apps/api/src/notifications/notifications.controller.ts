import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findForUser(@CurrentUser() userId: string) {
    return this.notificationsService.findForUser(userId);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() userId: string) {
    const count = await this.notificationsService.unreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.notificationsService.markRead(id, userId);
  }
}
