/**
 * Logging Interceptor
 * Logs all requests and responses with structured data
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestWithId, LogContext } from '../types/error.types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Add request ID to request object for use in other parts of the application
    request.requestId = requestId;

    // Log request
    this.logger.log('Incoming request', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      timestamp: new Date().toISOString(),
      body: this.sanitizeBody(request.body as unknown as Record<string, unknown>),
      query: request.query,
      params: request.params,
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        // Log successful response
        this.logger.log('Request completed successfully', {
          requestId,
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          responseSize: this.getResponseSize(data),
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log error response
        this.logger.error('Request failed', {
          requestId,
          method: request.method,
          url: request.url,
          statusCode: error.status || 500,
          duration,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        
        throw error;
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'otp', 'code'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  private getResponseSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
