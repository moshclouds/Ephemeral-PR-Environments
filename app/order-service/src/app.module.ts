import { Module } from '@nestjs/common';
import { OrdersModule } from './modules/orders/orders.module';
import { AppController } from './app.controller';

@Module({
  imports: [OrdersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

