import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth(): object {
    return {
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}
