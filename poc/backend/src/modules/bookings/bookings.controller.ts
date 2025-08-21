/**
 * Bookings Controller
 */

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get(':cognitoSub')
  async list(@Param('cognitoSub') cognitoSub: string) {
    return this.bookings.listBookings(cognitoSub);
  }

  @Post()
  async create(@Body() body: {
    cognitoSub: string;
    carId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    owner?: { email?: string; phone?: string };
  }) {
    return this.bookings.createBooking({
      cognitoSub: body.cognitoSub,
      carId: body.carId,
      startDate: body.startDate,
      endDate: body.endDate,
      totalPrice: body.totalPrice,
      ownerContact: body.owner,
    });
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.bookings.confirmBooking(id);
  }

  @Post(':id/payment/intent')
  async createPayment(@Param('id') id: string) {
    return this.bookings.createPaymentIntent(id);
  }

  @Post(':id/payment/confirm')
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { paymentIntentId: string; paymentMethodId: string },
  ) {
    return this.bookings.confirmPayment(id, body.paymentIntentId, body.paymentMethodId);
  }
}
