import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IOrdersService } from './orders.service';
import { OrdersRepository } from '../repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersServiceImpl implements IOrdersService {
  private readonly logger = new Logger(OrdersServiceImpl.name);
  
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly httpService: HttpService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { itemId, quantity } = createOrderDto;

    this.logger.log(`Creating order for item ${itemId}, quantity: ${quantity}`);

    // 1. Call Inventory Service
    try {
      this.logger.log(`Checking inventory for ${itemId}...`);
      await firstValueFrom(
        this.httpService.post(`${process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3001'}/inventory/deduct`, {
          sku: itemId,
          quantity: quantity,
        })
      );
      this.logger.log(`Inventory successfully deducted for ${itemId}.`);
    } catch (error: any) {
      this.logger.error(`Inventory deduction failed: ${error.message}`);
      throw new Error(`Order Failed: Inventory deduction failed for ${itemId}`);
    }

    // 2. Create Order
    const order = await this.ordersRepository.create({
      itemId: itemId,
      quantity: quantity,
      status: 'PENDING',
    });
    this.logger.log(`Order ${order.id} saved to database.`);

    // 3. Call Notification Service
    try {
      this.logger.log(`Sending notification for order ${order.id}...`);
      await firstValueFrom(
        this.httpService.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002'}/notifications`, {
          recipient: 'customer@example.com',
          message: `Order created for item ${order.itemId} (Quantity: ${quantity})`,
          channel: 'EMAIL',
        })
      );
      this.logger.log(`Notification sent for order ${order.id}.`);
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // Don't fail the order if notification fails
    }

    return order;
  }

  async getOrders(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }
}
