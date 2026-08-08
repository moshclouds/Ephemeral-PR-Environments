import { Module } from '@nestjs/common';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
