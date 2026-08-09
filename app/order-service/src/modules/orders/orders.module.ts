import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrdersController } from './controllers/orders.controller';
import { OrdersServiceImpl } from './services/orders.service.impl';
import { ORDERS_SERVICE_TOKEN } from './services/orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { PrismaService } from '../../core/config/prisma.service';

import { PrHttpModule } from '../../core/http/pr-http.module';

@Module({
  imports: [PrHttpModule],
  controllers: [OrdersController],
  providers: [
    PrismaService,
    OrdersRepository,
    {
      provide: ORDERS_SERVICE_TOKEN,
      useClass: OrdersServiceImpl,
    },
  ],
})
export class OrdersModule {}
