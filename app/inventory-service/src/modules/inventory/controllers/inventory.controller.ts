import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { DeductStockDto } from '../dto/deduct-stock.dto';
import { IInventoryService, INVENTORY_SERVICE_TOKEN } from '../services/inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject(INVENTORY_SERVICE_TOKEN)
    private readonly inventoryService: IInventoryService,
  ) {}

  @Post()
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Post('deduct')
  deduct(@Body() dto: DeductStockDto) {
    return this.inventoryService.deductStock(dto);
  }

  @Get()
  findAll() {
    return this.inventoryService.getAllItems();
  }
}
