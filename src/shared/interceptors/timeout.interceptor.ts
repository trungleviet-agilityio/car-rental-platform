/**
 * Timeout Interceptor
 * Prevents requests from hanging indefinitely by setting configurable timeouts
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeoutMs: number = 30000; // 30 seconds

  constructor(private readonly timeoutMs?: number) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timeoutValue = this.timeoutMs || this.getTimeoutForRequest(context);
    
    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException(
            `Request timeout after ${timeoutValue}ms`
          ));
        }
        return throwError(() => error);
      })
    );
  }

  private getTimeoutForRequest(context: ExecutionContext): number {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Different timeouts for different types of operations
    if (this.isFileUploadOperation(method, url)) {
      return 120000; // 2 minutes for file uploads
    }

    if (this.isReportOperation(url)) {
      return 60000; // 1 minute for reports
    }

    if (this.isPaymentOperation(url)) {
      return 45000; // 45 seconds for payment operations
    }

    if (this.isKycOperation(url)) {
      return 90000; // 90 seconds for KYC operations
    }

    return this.defaultTimeoutMs;
  }

  private isFileUploadOperation(method: string, url: string): boolean {
    return method === 'POST' && (
      url.includes('/upload') ||
      url.includes('/documents') ||
      url.includes('/kyc')
    );
  }

  private isReportOperation(url: string): boolean {
    return url.includes('/reports') || url.includes('/analytics');
  }

  private isPaymentOperation(url: string): boolean {
    return url.includes('/payments') || url.includes('/transactions');
  }

  private isKycOperation(url: string): boolean {
    return url.includes('/kyc') || url.includes('/verification');
  }
}
