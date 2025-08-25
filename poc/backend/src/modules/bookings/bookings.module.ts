/**
 * Bookings Module - Implementation following sequence diagrams with DIP
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { CarsModule } from '../cars/cars.module';
import { ProvidersModule } from '../../providers/providers.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    CarsModule,
    ProvidersModule,
    GuardsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
