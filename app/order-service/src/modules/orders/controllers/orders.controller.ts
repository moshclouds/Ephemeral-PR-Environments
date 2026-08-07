import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { IOrdersService, ORDERS_SERVICE_TOKEN } from '../services/orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(ORDERS_SERVICE_TOKEN)
    private readonly ordersService: IOrdersService,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.getOrders();
  }
}
