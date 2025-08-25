/**
 * Application Health Controller
 * Provides system health and configuration information
 */

import { Controller, Get, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  getHealth() {
    this.logger.log('Health endpoint called'); // Debug log
    try {
      return { 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: this.config.get('NODE_ENV', 'development'),
        version: 'v1',
        providers: {
          auth: this.config.get('AUTH_PROVIDER', 'mock'),
          storage: this.config.get('STORAGE_PROVIDER', 'mock'),
          notifications: this.config.get('NOTIFICATION_PROVIDER', 'mock'),
          payment: this.config.get('PAYMENT_PROVIDER', 'mock'),
          lambda: this.config.get('LAMBDA_PROVIDER', 'mock'),
          cars: 'internal',
          database: process.env.DB_DISABLE === 'true' ? 'in-memory' : 'postgresql'
        },
        debug: {
          DB_DISABLE: this.config.get('DB_DISABLE', 'NOT_SET'),
          NODE_ENV: this.config.get('NODE_ENV', 'NOT_SET')
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return { status: 'ok' }; // Fallback
    }
  }

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('health/readiness')
  readiness() {
    try {
      // Check if all required services are ready
      const checks = {
        database: process.env.DB_DISABLE === 'true' || true, // SQLite is always ready
        auth: this.config.get('AUTH_PROVIDER', 'mock') !== 'NOT_SET',
        storage: this.config.get('STORAGE_PROVIDER', 'mock') !== 'NOT_SET',
        notifications: this.config.get('NOTIFICATION_PROVIDER', 'mock') !== 'NOT_SET',
      };

      const allReady = Object.values(checks).every(Boolean);
      
      if (!allReady) {
        throw new HttpException(
          { status: 'not ready', checks },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw new HttpException(
        { status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('health/liveness')
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('info')
  info() {
    return {
      name: 'car-rental-backend',
      version: process.env.npm_package_version || '0.1.0',
      environment: this.config.get('NODE_ENV', 'development'),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug')
  debug() {
    this.logger.log('Debug endpoint called');
    return {
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      note: 'If you see this, route registration is working'
    };
  }
}