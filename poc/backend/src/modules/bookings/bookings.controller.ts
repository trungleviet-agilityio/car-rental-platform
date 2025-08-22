/**
 * Bookings Controller
 */

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDecisionDto } from './dto/decision.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthClaims } from '../../interfaces/auth-token.interface';
import { OwnerGuard } from '../../common/guards/owner.guard';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get(':cognitoSub')
  async list(@Param('cognitoSub') cognitoSub: string) {
    return this.bookings.listBookings(cognitoSub);
  }

  @Post()
  async create(@AuthUser() claims: AuthClaims | undefined, @Body() body: CreateBookingDto) {
    const sub = claims?.sub || body.cognitoSub;
    return this.bookings.createBooking({
      cognitoSub: sub,
      carId: body.carId,
      startDate: body.startDate,
      endDate: body.endDate,
      totalPrice: body.totalPrice,
      ownerContact: body.owner,
    });
  }

  @Post('decision')
  @UseGuards(OwnerGuard)
  async decision(@Body() body: BookingDecisionDto) {
    return this.bookings.ownerDecision(body.bookingId, body.decision, body.renter);
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
