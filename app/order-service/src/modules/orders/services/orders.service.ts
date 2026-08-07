import { Order } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';

export const ORDERS_SERVICE_TOKEN = 'ORDERS_SERVICE_TOKEN';

export interface IOrdersService {
  createOrder(createOrderDto: CreateOrderDto): Promise<Order>;
  getOrders(): Promise<Order[]>;
}
