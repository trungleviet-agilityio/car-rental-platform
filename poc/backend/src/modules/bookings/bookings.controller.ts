/**
 * Bookings Controller - Implementation following sequence diagrams
 * Implements the complete booking flow: Creation → Owner Decision → Payment
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ValidationPipe
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDecisionDto } from './dto/decision.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking (Step 7 in sequence diagram)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully, owner notified' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({ status: 404, description: 'Car not found' })
  @ApiBody({ type: CreateBookingDto })
  async createBooking(@Body(ValidationPipe) createBookingDto: CreateBookingDto) {
    return this.bookingsService.createBooking(createBookingDto);
  }

  @Post('decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Owner decision on booking (Accept/Reject)' })
  @ApiResponse({ status: 200, description: 'Decision processed, renter notified' })
  @ApiResponse({ status: 400, description: 'Invalid decision data' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiBody({ type: BookingDecisionDto })
  async makeDecision(@Body(ValidationPipe) decisionDto: BookingDecisionDto) {
    return this.bookingsService.processOwnerDecision(decisionDto);
  }

  @Get(':cognitoSub')
  @ApiOperation({ summary: 'Get user bookings by cognitoSub' })
  @ApiResponse({ status: 200, description: 'List of user bookings' })
  async getBookings(@Param('cognitoSub') cognitoSub: string) {
    return this.bookingsService.getBookings(cognitoSub);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get specific booking details' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.getBookingById(id);
  }

  // Payment Integration (Steps 15-17 in sequence diagram)
  @Post(':id/payment/intent')
  @ApiOperation({ summary: 'Create payment intent for booking' })
  @ApiResponse({ status: 200, description: 'Payment intent created' })
  async createPaymentIntent(@Param('id') bookingId: string) {
    return this.bookingsService.createPaymentIntent(bookingId);
  }

  @Post(':id/payment/confirm')
  @ApiOperation({ summary: 'Confirm booking payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed, booking updated' })
  async confirmPayment(
    @Param('id') bookingId: string,
    @Body() body: { paymentIntentId: string; paymentMethodId: string }
  ) {
    return this.bookingsService.confirmPayment(bookingId, body.paymentIntentId, body.paymentMethodId);
  }
}
