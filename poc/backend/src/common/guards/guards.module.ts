/**
 * Guards Module
 * Centralizes all authentication and authorization guards
 * Follows DIP principles with proper module organization
 */

import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { OwnerGuard } from './owner.guard';
import { ResourceOwnershipGuard } from './resource-ownership.guard';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [ProvidersModule], // Import ProvidersModule to get AUTH_TOKEN_VALIDATOR
  providers: [AuthGuard, OwnerGuard, ResourceOwnershipGuard],
  exports: [AuthGuard, OwnerGuard, ResourceOwnershipGuard],
})
export class GuardsModule {}
  