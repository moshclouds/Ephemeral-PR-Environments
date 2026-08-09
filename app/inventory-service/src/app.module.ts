import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AppController } from './app.controller';
import { HeaderPropagationInterceptor } from './interceptors/header-propagation.interceptor';

@Module({
  imports: [InventoryModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HeaderPropagationInterceptor,
    },
  ],
})
export class AppModule {}
