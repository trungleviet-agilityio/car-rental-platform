/**
 * Error Handler Utilities
 * Common error handling and logging functions
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('ErrorHandler');

/**
 * Logs an error with context
 */
export function logError(error: any, context?: string): void {
  const message = getErrorMessage(error);
  const contextStr = context ? `[${context}] ` : '';
  
  if (error instanceof Error) {
    logger.error(`${contextStr}${message}`, error.stack);
  } else {
    logger.error(`${contextStr}${message}`);
  }
}

/**
 * Extracts a readable error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.statusText) {
    return error.statusText;
  }
  
  return 'An unknown error occurred';
}

/**
 * Safely stringifies an error for logging
 */
export function stringifyError(error: any): string {
  try {
    if (error instanceof Error) {
      return JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
      }, null, 2);
    }
    
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

/**
 * Checks if an error is a specific type
 */
export function isErrorOfType(error: any, errorType: any): boolean {
  return error instanceof errorType;
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  }) as T;
}