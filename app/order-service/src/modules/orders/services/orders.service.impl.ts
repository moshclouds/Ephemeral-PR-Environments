import { Injectable } from '@nestjs/common';
import { IOrdersService } from './orders.service';
import { OrdersRepository } from '../repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order } from '@prisma/client';

@Injectable()
export class OrdersServiceImpl implements IOrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Basic business logic: all new orders are PENDING
    return this.ordersRepository.create({
      itemId: createOrderDto.itemId,
      quantity: createOrderDto.quantity,
      status: 'PENDING',
    });
  }

  async getOrders(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }
}
