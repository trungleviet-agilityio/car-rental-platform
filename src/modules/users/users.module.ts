/*
 * Users Module - User management and account activation module
 * Implements proper Clean Architecture with application and presentation layers
 */

import { Module } from '@nestjs/common';

// Application Layer
import { UsersService } from './application/services/users.service';

// Presentation Layer
import { UsersController } from './presentation/users.controller';

// Shared
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
