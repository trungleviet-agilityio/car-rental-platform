/**
 * Storage Module
 * Contains file storage business logic
 * Imports ProvidersModule for DI
 */

import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({ 
  imports: [ProvidersModule], 
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
