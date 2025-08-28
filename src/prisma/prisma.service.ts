import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
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
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  private setupLogging(): void {
    this.$on('query', (e: Prisma.QueryEvent) => {
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(`Prisma Info: ${e.message}`);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  /**
   * Soft delete implementation
   */
  async softDelete<T extends { deletedAt?: Date | null }>(
    model: string,
    where: Record<string, unknown>,
  ): Promise<T> {
    const updateData = {
      deletedAt: new Date(),
    };

    return this[model as keyof PrismaService].update({
      where,
      data: updateData,
    }) as Promise<T>;
  }

  /**
   * Find many with soft delete filter
   */
  async findManyNotDeleted<T>(
    model: string,
    args: Record<string, unknown> = {},
  ): Promise<T[]> {
    const where = {
      ...((args.where as Record<string, unknown>) || {}),
      deletedAt: null,
    };

    return this[model as keyof PrismaService].findMany({
      ...args,
      where,
    }) as Promise<T[]>;
  }

  /**
   * Find unique with soft delete filter
   */
  async findUniqueNotDeleted<T>(
    model: string,
    args: Record<string, unknown>,
  ): Promise<T | null> {
    const where = {
      ...((args.where as Record<string, unknown>) || {}),
      deletedAt: null,
    };

    return this[model as keyof PrismaService].findUnique({
      ...args,
      where,
    }) as Promise<T | null>;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      await this.$queryRaw`SELECT 1`;
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
    operations: (prisma: Omit<PrismaClient, '$transaction'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      try {
        return await operations(prisma);
      } catch (error) {
        this.logger.error('Transaction failed, rolling back', error);
        throw error;
      }
    });
  }
}
