import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';
import { HeaderPropagationInterceptor } from './interceptors/header-propagation.interceptor';

@Module({
  imports: [NotificationsModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HeaderPropagationInterceptor,
    },
  ],
})
export class AppModule {}
