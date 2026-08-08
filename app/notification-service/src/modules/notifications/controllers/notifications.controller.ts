import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NOTIFICATIONS_SERVICE_TOKEN } from '../services/notifications.service';
import type { INotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATIONS_SERVICE_TOKEN)
    private readonly notificationsService: INotificationsService,
  ) {}

  @Post()
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Get()
  findAll() {
    return this.notificationsService.getNotificationLogs();
  }
}
