import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IInventoryService } from './inventory.service';
import { InventoryRepository } from '../repositories/inventory.repository';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { DeductStockDto } from '../dto/deduct-stock.dto';
import { InventoryItem } from '@prisma/client';

@Injectable()
export class InventoryServiceImpl implements IInventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    return this.repository.create(dto);
  }

  async deductStock(dto: DeductStockDto): Promise<InventoryItem> {
    const item = await this.repository.findBySku(dto.sku);
    if (!item) {
      throw new NotFoundException(`Inventory item with SKU ${dto.sku} not found`);
    }

    if (item.availableQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for SKU ${dto.sku}. Available: ${item.availableQuantity}, Requested: ${dto.quantity}`,
      );
    }

    const newQuantity = item.availableQuantity - dto.quantity;
    return this.repository.updateQuantity(item.id, newQuantity);
  }

  async getAllItems(): Promise<InventoryItem[]> {
    return this.repository.findAll();
  }
}
