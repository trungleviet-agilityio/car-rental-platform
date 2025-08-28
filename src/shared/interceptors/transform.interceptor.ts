/**
 * Transform Interceptor
 * Standardizes all API responses to follow consistent format
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { ApiResponse } from '@/core/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      map((data) => {
        // If the data is already in ApiResponse format, return as-is
        if (this.isApiResponse(data)) {
          return data;
        }

        // Generate request ID for tracing
        const requestId = this.generateRequestId();
        
        // Create standardized response
        const response: ApiResponse<T> = {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            version: process.env.API_VERSION || '1.0.0',
          },
        };

        // Add pagination meta if data has pagination info
        if (this.hasPaginationInfo(data)) {
          response.meta!.pagination = this.extractPaginationMeta(data);
        }

        return response;
      })
    );
  }

  private isApiResponse(data: any): data is ApiResponse {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      typeof data.success === 'boolean'
    );
  }

  private hasPaginationInfo(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      ('items' in data || 'data' in data) &&
      ('total' in data || 'count' in data) &&
      ('page' in data || 'offset' in data)
    );
  }

  private extractPaginationMeta(data: any): any {
    const items = data.items || data.data || [];
    const total = data.total || data.count || 0;
    const page = data.page || 1;
    const limit = data.limit || data.pageSize || items.length;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
