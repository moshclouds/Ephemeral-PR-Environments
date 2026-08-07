import { NotificationLog } from '@prisma/client';
import { SendNotificationDto } from '../dto/send-notification.dto';

export const NOTIFICATIONS_SERVICE_TOKEN = 'NOTIFICATIONS_SERVICE_TOKEN';

export interface INotificationsService {
  sendNotification(dto: SendNotificationDto): Promise<NotificationLog>;
  getNotificationLogs(): Promise<NotificationLog[]>;
}
