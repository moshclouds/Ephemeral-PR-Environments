import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OrdersModule } from './modules/orders/orders.module';
import { AppController } from './app.controller';
import { HeaderPropagationInterceptor } from './interceptors/header-propagation.interceptor';

@Module({
  imports: [OrdersModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HeaderPropagationInterceptor,
    },
  ],
})
export class AppModule {}

