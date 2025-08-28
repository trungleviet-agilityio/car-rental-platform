import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Define Prisma event types
interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
}

interface PrismaLogEvent {
  message: string;
}

// Define model types for soft delete operations
type PrismaModelKey = 
  | 'user'
  | 'vehicle'
  | 'booking'
  | 'payment'
  | 'review'
  | 'onboardingProgress'
  | 'kycDocument'
  | 'phoneVerification'
  | 'notificationTemplate'
  | 'notification'
  | 'notificationLog'
  | 'auditLog'
  | 'systemSetting';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: any; // Will be initialized after Prisma client generation

  constructor(private configService: ConfigService) {
    this.initializePrisma();
  }

  private initializePrisma(): void {
    // Dynamic import to avoid issues before Prisma client is generated
    try {
      const { PrismaClient } = require('@prisma/client');
      
      this.prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
        errorFormat: 'pretty',
      });

      // Set up logging
      this.setupLogging();
    } catch (error) {
      this.logger.error('Failed to initialize Prisma client. Make sure to run: npx prisma generate', error);
      throw error;
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  private setupLogging(): void {
    this.prisma.$on('query', (e: PrismaQueryEvent) => {
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    this.prisma.$on('error', (e: PrismaLogEvent) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    this.prisma.$on('info', (e: PrismaLogEvent) => {
      this.logger.log(`Prisma Info: ${e.message}`);
    });

    this.prisma.$on('warn', (e: PrismaLogEvent) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  /**
   * Soft delete implementation
   */
  async softDelete<T extends { deletedAt?: Date | null }>(
    model: PrismaModelKey,
    where: Record<string, unknown>,
  ): Promise<T> {
    const updateData = {
      deletedAt: new Date(),
    };

    return this.prisma[model].update({
      where,
      data: updateData,
    }) as Promise<T>;
  }

  /**
   * Find many with soft delete filter
   */
  async findManyNotDeleted<T>(
    model: PrismaModelKey,
    args: Record<string, unknown> = {},
  ): Promise<T[]> {
    const where = {
      ...((args.where as Record<string, unknown>) || {}),
      deletedAt: null,
    };

    return this.prisma[model].findMany({
      ...args,
      where,
    }) as Promise<T[]>;
  }

  /**
   * Find unique with soft delete filter
   */
  async findUniqueNotDeleted<T>(
    model: PrismaModelKey,
    args: Record<string, unknown>,
  ): Promise<T | null> {
    const where = {
      ...((args.where as Record<string, unknown>) || {}),
      deletedAt: null,
    };

    return this.prisma[model].findUnique({
      ...args,
      where,
    }) as Promise<T | null>;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Transaction helper with automatic rollback on error
   */
  async executeTransaction<T>(
    operations: (prisma: any) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (prisma: any) => {
      try {
        return await operations(prisma);
      } catch (error) {
        this.logger.error('Transaction failed, rolling back', error);
        throw error;
      }
    });
  }

  // Expose transaction method directly
  get $transaction() {
    return this.prisma.$transaction;
  }

  // Expose queryRaw method
  get $queryRaw() {
    return this.prisma.$queryRaw;
  }

  // Proxy all Prisma methods to the internal prisma instance
  get user() { return this.prisma.user; }
  get vehicle() { return this.prisma.vehicle; }
  get booking() { return this.prisma.booking; }
  get payment() { return this.prisma.payment; }
  get review() { return this.prisma.review; }
  get onboardingProgress() { return this.prisma.onboardingProgress; }
  get kycDocument() { return this.prisma.kycDocument; }
  get phoneVerification() { return this.prisma.phoneVerification; }
  get notificationTemplate() { return this.prisma.notificationTemplate; }
  get notification() { return this.prisma.notification; }
  get notificationLog() { return this.prisma.notificationLog; }
  get auditLog() { return this.prisma.auditLog; }
  get systemSetting() { return this.prisma.systemSetting; }
}
