/**
 * Cars Module - simple in-memory catalog for PoC
 */

import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { ProvidersModule } from '../../providers/providers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car.entity';

@Module({
  imports: [ProvidersModule, TypeOrmModule.forFeature([Car])],
  providers: [CarsService],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {}
