import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth(): object {
    return {
      service: 'inventory-service V2',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}
