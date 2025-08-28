/**
 * Prisma Exception Filter
 * Handles Prisma-specific database errors and converts them to user-friendly messages
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError, ApiResponse } from '@/core/types';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract user information if available
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    let status: HttpStatus;
    let apiError: ApiError;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const result = this.handleKnownRequestError(exception);
      status = result.status;
      apiError = result.error;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      const result = this.handleValidationError(exception);
      status = result.status;
      apiError = result.error;
    } else {
      // Fallback for other Prisma errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      apiError = {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
        timestamp: new Date().toISOString(),
      };
    }

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
    this.logDatabaseError(exception, request, userId, status);

    // Send response
    response.status(status).json(apiResponse);
  }

  private handleKnownRequestError(exception: Prisma.PrismaClientKnownRequestError): {
    status: HttpStatus;
    error: ApiError;
  } {
    const { code, meta } = exception;

    switch (code) {
      case 'P2002': // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: this.getUniqueConstraintMessage(meta),
            details: {
              constraintFields: meta?.target,
              constraint: meta?.constraint,
            },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2014': // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          error: {
            code: 'REQUIRED_RELATION_VIOLATION',
            message: 'The change you are trying to make would violate a required relation',
            details: { relation: meta?.relation_name },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2003': // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            message: 'Foreign key constraint failed',
            details: { 
              field: meta?.field_name,
              constraint: meta?.constraint,
            },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2025': // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'The requested record was not found',
            details: { cause: meta?.cause },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2016': // Query interpretation error
        return {
          status: HttpStatus.BAD_REQUEST,
          error: {
            code: 'QUERY_INTERPRETATION_ERROR',
            message: 'Query interpretation error',
            details: { details: meta?.details },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2021': // Table not found
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: {
            code: 'TABLE_NOT_FOUND',
            message: 'Database table not found',
            details: { table: meta?.table },
            timestamp: new Date().toISOString(),
          },
        };

      case 'P2022': // Column not found
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: 'Database column not found',
            details: { column: meta?.column },
            timestamp: new Date().toISOString(),
          },
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: {
            code: 'DATABASE_ERROR',
            message: 'An unexpected database error occurred',
            details: { 
              errorCode: code,
              meta: meta,
            },
            timestamp: new Date().toISOString(),
          },
        };
    }
  }

  private handleValidationError(exception: Prisma.PrismaClientValidationError): {
    status: HttpStatus;
    error: ApiError;
  } {
    return {
      status: HttpStatus.BAD_REQUEST,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Database validation failed',
        details: {
          originalError: exception.message,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  private getUniqueConstraintMessage(meta: any): string {
    const fields = meta?.target;
    
    if (!fields || !Array.isArray(fields)) {
      return 'A record with these values already exists';
    }

    // Create user-friendly messages for common fields
    const fieldMessages: Record<string, string> = {
      email: 'An account with this email address already exists',
      username: 'This username is already taken',
      phone: 'An account with this phone number already exists',
      phoneNumber: 'An account with this phone number already exists',
      licensePlate: 'A vehicle with this license plate is already registered',
      vin: 'A vehicle with this VIN is already registered',
    };

    if (fields.length === 1) {
      const field = fields[0];
      return fieldMessages[field] || `A record with this ${field} already exists`;
    }

    // Multiple fields
    const fieldNames = fields.map((field: string) => 
      field.replace(/([A-Z])/g, ' $1').toLowerCase()
    ).join(', ');
    
    return `A record with these values already exists: ${fieldNames}`;
  }

  private logDatabaseError(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    request: Request,
    userId: string,
    status: HttpStatus
  ): void {
    const { method, url, ip } = request;
    
    const logMessage = `Database Error: ${method} ${url} - ${status} - User: ${userId} - IP: ${ip}`;
    
    if (status >= 500) {
      // Server errors - log as error
      this.logger.error(`${logMessage} - ${exception.message}`, exception.stack);
    } else {
      // Client errors - log as warning
      this.logger.warn(`${logMessage} - ${exception.message}`);
    }

    // Log additional context for debugging database issues
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.debug(`Prisma Error Code: ${exception.code}`);
      this.logger.debug(`Prisma Meta: ${JSON.stringify(exception.meta)}`);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
