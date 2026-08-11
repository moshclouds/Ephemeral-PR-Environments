import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth(): object {
    return {
      service: 'order-service',
      status: 'healthy ABC-44',
      timestamp: new Date().toISOString()
    };
  }
}
