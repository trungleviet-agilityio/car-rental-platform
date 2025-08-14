/**
 * Main Application Module
 * Imports all feature modules and configures the application
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';
import { NotifyModule } from './notify/notify.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { PaymentModule } from './payment/payment.module';

// App Controller
import { AppController } from './app.controller';

// Entities
import { User } from './users/user.entity';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Database Configuration
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.DB_DISABLE === 'true') {
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [User],
            synchronize: true,
          } as any;
        }
        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'car_rental',
          entities: [User],
          synchronize: true,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        } as any;
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
