import { Controller, Delete, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import type { NotificationQueryOptions, JwtPayload } from '@repo/types';
import { NotificationQueryDto } from '@repo/dto';
import { CurrentUser } from '@repo/decorators';
import { firstValueFrom } from 'rxjs';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    @Inject('NOTIFICATIONS') private readonly notificationsClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  async getNotifications(@CurrentUser() user: JwtPayload, @Query() query: NotificationQueryDto) {
    const options: NotificationQueryOptions = {
      page: query.page ?? 1,
      size: query.size ?? 10,
      unreadOnly: query.unreadOnly ?? false,
    };

    return firstValueFrom(
      this.notificationsClient.send('notifications.findByUser', {
        userId: user.id,
        options,
      }),
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.markAsRead', {
        notificationId,
        userId: user.id,
      }),
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.markAllAsRead', {
        userId: user.id,
      }),
    );
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all notifications' })
  async deleteAllNotifications(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.deleteAll', {
        userId: user.id,
      }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.delete', {
        notificationId,
        userId: user.id,
      }),
    );
  }
}
