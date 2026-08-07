import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { InventoryItem, Prisma } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InventoryItemCreateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.create({ data });
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findUnique({ where: { sku } });
  }

  async updateQuantity(id: string, newQuantity: number): Promise<InventoryItem> {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { availableQuantity: newQuantity },
    });
  }

  async findAll(): Promise<InventoryItem[]> {
    return this.prisma.inventoryItem.findMany();
  }
}
