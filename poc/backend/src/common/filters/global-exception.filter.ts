/**
 * Global Exception Filter
 * Handles all exceptions consistently across the application
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
import { ErrorResponse, ExceptionResponse, ErrorDetails } from '../types/error.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: ErrorDetails = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as ExceptionResponse;
        message = responseObj.message || exception.message;
        error = responseObj.error || this.getErrorType(status);
        details = responseObj.details || {};
      } else {
        message = exception.message;
        error = this.getErrorType(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = 'InternalServerError';
    }

    // Log the exception
    this.logger.error('Global exception caught', {
      requestId,
      method: request.method,
      url: request.url,
      status,
      error: message,
      stack: exception instanceof Error ? exception.stack : undefined,
      timestamp,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Create consistent error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      requestId,
      timestamp,
      path: request.url,
      method: request.method,
      ...(Object.keys(details).length > 0 && { details }),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorType(status: number): string {
    switch (status) {
      case 400:
        return 'BadRequest';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'NotFound';
      case 409:
        return 'Conflict';
      case 422:
        return 'UnprocessableEntity';
      case 429:
        return 'TooManyRequests';
      case 500:
        return 'InternalServerError';
      case 502:
        return 'BadGateway';
      case 503:
        return 'ServiceUnavailable';
      default:
        return 'InternalServerError';
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
