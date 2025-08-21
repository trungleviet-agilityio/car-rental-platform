/**
 * Cars Module - simple in-memory catalog for PoC
 */

import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [CarsService],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {}
