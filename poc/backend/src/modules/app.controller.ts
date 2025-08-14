/**
 * Application Health Controller
 * Provides system health and configuration information
 */

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get('/')
  health() {
    return { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.config.get('NODE_ENV', 'development'),
      providers: {
        auth: this.config.get('AUTH_PROVIDER', 'mock'),
        storage: this.config.get('STORAGE_PROVIDER', 'mock'),
        notifications: this.config.get('NOTIFICATION_PROVIDER', 'mock'),
        payment: this.config.get('PAYMENT_PROVIDER', 'mock'),
        database: process.env.DB_DISABLE === 'true' ? 'in-memory' : 'postgresql'
      },
      debug: {
        DB_DISABLE: this.config.get('DB_DISABLE', 'NOT_SET'),
        NODE_ENV: this.config.get('NODE_ENV', 'NOT_SET')
      }
    };
  }
}