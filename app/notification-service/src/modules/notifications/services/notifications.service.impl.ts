import { Injectable } from '@nestjs/common';
import { INotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NotificationLog } from '@prisma/client';

@Injectable()
export class NotificationsServiceImpl implements INotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async sendNotification(dto: SendNotificationDto): Promise<NotificationLog> {
    // Simulating sending notification logic & logging to MongoDB
    return this.repository.create({
      recipient: dto.recipient,
      message: dto.message,
      channel: dto.channel || 'EMAIL',
      status: 'SENT',
    });
  }

  async getNotificationLogs(): Promise<NotificationLog[]> {
    return this.repository.findAll();
  }
}
