import {
  Controller,
  Get,
  Inject,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationQueryOptions } from '@repo/types';
import { firstValueFrom } from 'rxjs';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

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
  async getNotifications(
    @Req() req: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true }))
    unreadOnly?: boolean,
  ) {
    const options: NotificationQueryOptions = {
      page: page || 1,
      size: size || 10,
      unreadOnly: unreadOnly || false,
    };

    return firstValueFrom(
      this.notificationsClient.send('notifications.findByUser', {
        userId: req.user.id,
        options,
      }),
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') notificationId: string,
  ) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.markAsRead', {
        notificationId,
        userId: req.user.id,
      }),
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.notificationsClient.send('notifications.markAllAsRead', {
        userId: req.user.id,
      }),
    );
  }
}
