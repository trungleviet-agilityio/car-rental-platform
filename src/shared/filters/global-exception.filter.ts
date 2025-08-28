/**
 * Global Exception Filter
 * Catches all unhandled exceptions and provides a fallback error response
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError, ApiResponse } from '@/core/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract user information if available
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    // Determine status code
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    
    if (exception.status) {
      status = exception.status;
    } else if (exception.statusCode) {
      status = exception.statusCode;
    }

    // Create error response
    const apiError: ApiError = {
      code: this.getErrorCode(exception, status),
      message: this.getErrorMessage(exception, status),
      details: this.getErrorDetails(exception),
      timestamp: new Date().toISOString(),
    };

    // Create standardized API response
    const apiResponse: ApiResponse = {
      success: false,
      error: apiError,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: process.env.API_VERSION || '1.0.0',
      },
    };

    // Log the error
    this.logUnhandledException(exception, request, userId, status);

    // Send response
    response.status(status).json(apiResponse);
  }

  private getErrorCode(exception: any, status: HttpStatus): string {
    // Return specific error code if provided
    if (exception.code && typeof exception.code === 'string') {
      return exception.code;
    }

    // Handle specific error types
    if (exception.name) {
      switch (exception.name) {
        case 'ValidationError':
          return 'VALIDATION_ERROR';
        case 'UnauthorizedError':
          return 'UNAUTHORIZED';
        case 'ForbiddenError':
          return 'FORBIDDEN';
        case 'NotFoundError':
          return 'NOT_FOUND';
        case 'ConflictError':
          return 'CONFLICT';
        case 'TimeoutError':
          return 'TIMEOUT';
        case 'RateLimitError':
          return 'RATE_LIMIT_EXCEEDED';
        case 'PaymentError':
          return 'PAYMENT_ERROR';
        case 'ExternalServiceError':
          return 'EXTERNAL_SERVICE_ERROR';
        default:
          break;
      }
    }

    // Generate code based on status
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private getErrorMessage(exception: any, status: HttpStatus): string {
    // Return specific message if provided
    if (exception.message && typeof exception.message === 'string') {
      return this.sanitizeErrorMessage(exception.message);
    }

    // Fallback messages based on status
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad request';
      case HttpStatus.UNAUTHORIZED:
        return 'Authentication required';
      case HttpStatus.FORBIDDEN:
        return 'Access denied';
      case HttpStatus.NOT_FOUND:
        return 'Resource not found';
      case HttpStatus.CONFLICT:
        return 'Conflict with current state';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Validation failed';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Rate limit exceeded';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'An internal server error occurred';
    }
  }

  private getErrorDetails(exception: any): Record<string, any> | undefined {
    const details: Record<string, any> = {};

    // Include validation errors if present
    if (exception.errors && Array.isArray(exception.errors)) {
      details.validationErrors = exception.errors;
    }

    // Include additional details
    if (exception.details && typeof exception.details === 'object') {
      details.additionalInfo = exception.details;
    }

    // Include error name for debugging
    if (exception.name && process.env.NODE_ENV !== 'production') {
      details.errorType = exception.name;
    }

    // Include constraint information for database errors
    if (exception.constraint) {
      details.constraint = exception.constraint;
    }

    return Object.keys(details).length > 0 ? details : undefined;
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages in production
    if (process.env.NODE_ENV === 'production') {
      // Remove file paths, stack traces, and other sensitive data
      message = message
        .replace(/\/[^\s]+\.(js|ts)/g, '[file]')
        .replace(/at\s+.*\s+\([^)]+\)/g, '')
        .replace(/\n\s*at\s+.*/g, '')
        .trim();
    }

    return message;
  }

  private logUnhandledException(
    exception: any,
    request: Request,
    userId: string,
    status: HttpStatus
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    
    const logMessage = `Unhandled Exception: ${method} ${url} - ${status} - User: ${userId} - IP: ${ip}`;
    
    // Always log unhandled exceptions as errors
    this.logger.error(logMessage, exception.stack || exception.message);

    // Log additional context for debugging
    this.logger.debug(`Exception Type: ${exception.constructor?.name || 'Unknown'}`);
    this.logger.debug(`User Agent: ${userAgent}`);
    
    if (exception.name) {
      this.logger.debug(`Exception Name: ${exception.name}`);
    }

    // Log request details for 5xx errors
    if (status >= 500) {
      this.logger.debug(`Request Headers: ${JSON.stringify(this.sanitizeHeaders(headers))}`);
      this.logger.debug(`Request Body: ${JSON.stringify(request.body)}`);
      this.logger.debug(`Request Query: ${JSON.stringify(request.query)}`);
    }
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-access-token'];
    
    return sanitized;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
