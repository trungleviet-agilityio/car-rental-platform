/**
 * Error Response Types
 * Proper TypeScript types for error handling
 */

export interface ErrorDetails {
  attempts?: number;
  remainingAttempts?: number;
  maxAttempts?: number;
  [key: string]: unknown;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  requestId: string;
  timestamp: string;
  path: string;
  method: string;
  details?: ErrorDetails;
}

export interface ExceptionResponse {
  message: string;
  error: string;
  requestId: string;
  provider?: string;
  details?: ErrorDetails;
}

export interface RequestWithId extends Request {
  requestId?: string;
  ip?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface LogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  statusCode?: number;
  duration?: number;
  responseSize?: number;
  error?: string;
  stack?: string;
}
