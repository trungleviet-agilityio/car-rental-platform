import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'car_rental',
        entities: [User],
        synchronize: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    KycModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
