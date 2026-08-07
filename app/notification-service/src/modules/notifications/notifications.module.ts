import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsServiceImpl } from './services/notifications.service.impl';
import { NOTIFICATIONS_SERVICE_TOKEN } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { PrismaService } from '../../core/config/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationsRepository,
    {
      provide: NOTIFICATIONS_SERVICE_TOKEN,
      useClass: NotificationsServiceImpl,
    },
  ],
})
export class NotificationsModule {}
