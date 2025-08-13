/**
 * App controller
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
        mode: this.config.get('PROVIDER_MODE', 'mock'),
        database: this.config.get('DB_DISABLE', 'true') === 'true' ? 'in-memory' : 'postgresql',
        auth: this.config.get('PROVIDER_MODE', 'mock') === 'aws' ? 'cognito' : 'mock',
        storage: this.config.get('PROVIDER_MODE', 'mock') === 'aws' ? 's3' : 'mock',
        notifications: this.config.get('PROVIDER_MODE', 'mock') === 'aws' ? 'ses/sns' : 'mock',
        kyc: this.config.get('PROVIDER_MODE', 'mock') === 'aws' ? 'step-functions' : 'mock'
      }
    };
  }
}
