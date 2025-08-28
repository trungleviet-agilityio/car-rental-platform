/**
 * HTTP Exception Filter
 * Standardizes error responses and provides detailed error information
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError, ApiResponse } from '@/core/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract user information if available
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    // Parse exception response
    const errorResponse = typeof exceptionResponse === 'string' 
      ? { message: exceptionResponse }
      : exceptionResponse as any;

    // Create standardized error
    const apiError: ApiError = {
      code: this.getErrorCode(status, errorResponse),
      message: this.getErrorMessage(errorResponse),
      details: this.getErrorDetails(errorResponse),
      field: errorResponse.field,
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

    // Log the error with context
    this.logError(exception, request, userId, status);

    // Send response
    response.status(status).json(apiResponse);
  }

  private getErrorCode(status: number, errorResponse: any): string {
    // Return specific error code if provided
    if (errorResponse.code) {
      return errorResponse.code;
    }

    // Generate standard error codes based on HTTP status
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
        return 'INTERNAL_ERROR';
      default:
        return `HTTP_${status}`;
    }
  }

  private getErrorMessage(errorResponse: any): string {
    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (errorResponse.message) {
      // Handle validation error arrays
      if (Array.isArray(errorResponse.message)) {
        return errorResponse.message.join(', ');
      }
      return errorResponse.message;
    }

    return 'An error occurred';
  }

  private getErrorDetails(errorResponse: any): Record<string, any> | undefined {
    const details: Record<string, any> = {};

    // Include validation errors if present
    if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
      details.validationErrors = errorResponse.errors;
    }

    // Include additional error details
    if (errorResponse.details) {
      details.additionalInfo = errorResponse.details;
    }

    // Include constraint violations for database errors
    if (errorResponse.constraint) {
      details.constraint = errorResponse.constraint;
    }

    // Include error path for nested validation errors
    if (errorResponse.path) {
      details.path = errorResponse.path;
    }

    return Object.keys(details).length > 0 ? details : undefined;
  }

  private logError(
    exception: HttpException, 
    request: Request, 
    userId: string, 
    status: number
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    const logMessage = `HTTP Exception: ${method} ${url} - ${status} - User: ${userId} - IP: ${ip}`;
    
    if (status >= 500) {
      // Server errors - log as error with stack trace
      this.logger.error(logMessage, exception.stack);
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn(`${logMessage} - ${exception.message}`);
    } else {
      // Other status codes - log as debug
      this.logger.debug(`${logMessage} - ${exception.message}`);
    }

    // Log additional context for debugging
    if (status >= 500) {
      this.logger.debug(`Request Headers: ${JSON.stringify(headers)}`);
      this.logger.debug(`Request Body: ${JSON.stringify(request.body)}`);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
