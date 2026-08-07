import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryServiceImpl } from './services/inventory.service.impl';
import { INVENTORY_SERVICE_TOKEN } from './services/inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { PrismaService } from '../../core/config/prisma.service';

@Module({
  controllers: [InventoryController],
  providers: [
    PrismaService,
    InventoryRepository,
    {
      provide: INVENTORY_SERVICE_TOKEN,
      useClass: InventoryServiceImpl,
    },
  ],
})
export class InventoryModule {}
