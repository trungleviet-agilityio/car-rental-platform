/**
 * Logging Interceptor
 * Logs all incoming requests and outgoing responses for monitoring and debugging
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Extract user information from request if available
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    this.logger.log(
      `Incoming Request: ${method} ${url} - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
          );

          // Log additional details for important operations
          if (this.isImportantOperation(method, url)) {
            this.logger.debug(
              `Response Data Size: ${JSON.stringify(data).length} chars`
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          this.logger.error(
            `Request Failed: ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`,
            error.stack
          );
        },
      })
    );
  }

  private isImportantOperation(method: string, url: string): boolean {
    // Define which operations are considered important for detailed logging
    const importantPatterns = [
      /\/auth\//,
      /\/bookings/,
      /\/payments/,
      /\/kyc/,
      /\/vehicles.*\/booking/,
    ];

    return importantPatterns.some(pattern => pattern.test(url)) || 
           ['POST', 'PUT', 'DELETE'].includes(method);
  }
}
