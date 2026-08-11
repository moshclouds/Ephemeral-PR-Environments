import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';

// We use AsyncLocalStorage to pass headers down the execution context
// without manually passing them through every function call.
export const headerStorage = new AsyncLocalStorage<Record<string, string>>();

@Injectable()
export class HeaderPropagationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HeaderPropagationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract any header that starts with 'x-' and ends with '-pr'
    const propagatedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (key.toLowerCase().startsWith('x-') && key.toLowerCase().endsWith('-pr')) {
        propagatedHeaders[key] = value as string;
      }
    }
    
    if (Object.keys(propagatedHeaders).length > 0) {
      this.logger.log(`[HTTP Interceptor] Received PR Headers: ${JSON.stringify(propagatedHeaders)}`);
    }

    // Run the rest of the request lifecycle within this async context
    return headerStorage.run(propagatedHeaders, () => {
      return next.handle();
    });
  }
}
