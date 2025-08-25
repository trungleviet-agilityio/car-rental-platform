/**
 * Request/Response Logging Interceptor
 * Logs detailed request and response information for debugging and monitoring
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

@Injectable()
export class RequestResponseLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestResponseLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Add request ID to request object
    (request as any).requestId = requestId;

    // Log request details
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logResponse(request, response, data, duration, requestId);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logError(request, response, error, duration, requestId);
        throw error;
      }),
    );
  }

  private logRequest(request: Request, requestId: string): void {
    const logData = {
      requestId,
      type: 'REQUEST',
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    this.logger.log('Incoming request', logData);
  }

  private logResponse(
    request: Request,
    response: Response,
    data: any,
    duration: number,
    requestId: string,
  ): void {
    const logData = {
      requestId,
      type: 'RESPONSE',
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      responseSize: this.getResponseSize(data),
      timestamp: new Date().toISOString(),
    };

    this.logger.log('Response sent', logData);
  }

  private logError(
    request: Request,
    response: Response,
    error: any,
    duration: number,
    requestId: string,
  ): void {
    const logData = {
      requestId,
      type: 'ERROR',
      method: request.method,
      url: request.url,
      statusCode: error.status || 500,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Request failed', logData);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'otp', 'code', 'clientSecret'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  private getResponseSize(data: any): number {
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
