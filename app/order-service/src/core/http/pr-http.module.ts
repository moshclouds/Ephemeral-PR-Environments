import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { headerStorage } from '../../interceptors/header-propagation.interceptor';
import { rewriteUrlForPr } from './url-resolver.util';

@Module({
  imports: [HttpModule],
  exports: [HttpModule],
})
export class PrHttpModule implements OnModuleInit {
  private readonly logger = new Logger(PrHttpModule.name);

  // Extract URLs to environment variables with sane defaults for local docker-compose
  private readonly inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3001';
  private readonly notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002';
  private readonly cloudRunSuffix = process.env.CLOUD_RUN_URL_SUFFIX || '-ephemeral-poc.a.run.app';

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    // Global Axios Interceptor to attach X-*-PR headers and dynamically rewrite URLs for PR environments
    this.httpService.axiosRef.interceptors.request.use((config) => {
      const headers = headerStorage.getStore();
      if (headers) {
        // 1. Propagate headers
        Object.entries(headers).forEach(([key, value]) => {
          config.headers[key] = value;
        });

        // 2. Dynamic URL Rewriting
        config.url = rewriteUrlForPr(
          config.url,
          headers as Record<string, string>,
          [
            { name: 'inventory-service', baseUrl: this.inventoryServiceUrl, headerKey: 'x-inventory-pr' },
            { name: 'notification-service', baseUrl: this.notificationServiceUrl, headerKey: 'x-notification-pr' }
          ],
          this.cloudRunSuffix
        );
        
        this.logger.log(`[HTTP Interceptor] Outgoing request dynamically routed to: ${config.url}`);
        this.logger.log(`[HTTP Interceptor] Attached propagated headers: ${JSON.stringify(headers)}`);
      }
      return config;
    });
  }
}
