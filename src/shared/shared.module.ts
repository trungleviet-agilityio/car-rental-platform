/**
 * Shared Module
 * Module for all shared services, utilities, and configurations
 */

import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Database
import { PrismaService } from './database/prisma.service';

// Interceptors (simplified for Phase 1)
import { LoggingInterceptor } from './interceptors/logging.interceptor';

// Filters (simplified for Phase 1)
import { HttpExceptionFilter } from './filters/http-exception.filter';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  providers: [
    // Database
    PrismaService,
    
    // Phase 1: Basic interceptors and filters
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Basic exception handling for Phase 1
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    
    // Guards
    JwtAuthGuard,
  ],
  exports: [
    PrismaService,
    JwtAuthGuard,
  ],
})
export class SharedModule {}
