import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AppController } from './app.controller';

@Module({
  imports: [InventoryModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
