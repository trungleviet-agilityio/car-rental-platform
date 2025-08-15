/**
 * Main Application Module
 * Imports all feature modules and configures the application
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';
import { NotifyModule } from './notify/notify.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { PaymentModule } from './payment/payment.module';

// App Controller
import { AppController } from './app.controller';

// Configuration
import { AppConfig } from '../config/app.config';

// Entities
import { User } from './users/user.entity';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Database Configuration
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        const dbDisable = process.env.DB_DISABLE;
        console.log('🔍 TypeORM Config - DB_DISABLE:', dbDisable); // Debug log
        
        if (dbDisable === 'true') {
          console.log('📱 Using in-memory SQLite database'); // Debug log
          // In-memory SQLite for development/testing
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [User],
            synchronize: true, // OK for in-memory
            logging: false,
          };
        }
        
        console.log('🐘 Using PostgreSQL database'); // Debug log
        // PostgreSQL with proper migrations
        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'car_rental',
          entities: [User],
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: true, // Auto-run migrations on startup
          synchronize: false, // Use migrations in production
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // Feature Modules
    AuthModule,
    KycModule,
    NotifyModule,
    PaymentModule,
    UsersModule,
    StorageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
