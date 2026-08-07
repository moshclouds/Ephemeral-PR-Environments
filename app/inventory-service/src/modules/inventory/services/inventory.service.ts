import { InventoryItem } from '@prisma/client';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { DeductStockDto } from '../dto/deduct-stock.dto';

export const INVENTORY_SERVICE_TOKEN = 'INVENTORY_SERVICE_TOKEN';

export interface IInventoryService {
  createItem(dto: CreateInventoryItemDto): Promise<InventoryItem>;
  deductStock(dto: DeductStockDto): Promise<InventoryItem>;
  getAllItems(): Promise<InventoryItem[]>;
}
