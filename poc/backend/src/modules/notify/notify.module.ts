/**
 * Notify Module
 * Contains notification business logic
 * Imports ProvidersModule for DI
 */

import { Module } from '@nestjs/common';
import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({ 
  imports: [ProvidersModule], 
  controllers: [NotifyController],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}