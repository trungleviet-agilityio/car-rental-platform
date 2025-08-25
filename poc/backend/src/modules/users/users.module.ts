/**
 * Users Module - DIP implementation
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { GuardsModule } from '../../common/guards/guards.module';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GuardsModule, // Import GuardsModule to use AuthGuard
    ProvidersModule, // Import ProvidersModule to get AUTH_TOKEN_VALIDATOR
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
