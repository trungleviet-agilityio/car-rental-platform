/**
 * Enhanced Bookings Controller - Secure implementation
 * Implements authentication and resource ownership following DIP principles
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
  ValidationPipe,
  Request
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDecisionDto } from './dto/decision.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OwnerGuard } from '../../common/guards/owner.guard';
import { ResourceOwnershipGuard } from '../../common/guards/resource-ownership.guard';
import { RequestWithAuth } from '../../common/types/auth.types';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(AuthGuard) // Protect all booking endpoints with authentication
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBooking(@Body(ValidationPipe) createBookingDto: CreateBookingDto, @Request() req: RequestWithAuth) {
    // Ensure the authenticated user can only create bookings for themselves
    if (createBookingDto.cognitoSub && createBookingDto.cognitoSub !== req.auth.sub) {
      throw new ForbiddenException('Cannot create bookings for other users');
    }
    
    // Set the cognitoSub from the authenticated user if not provided
    const bookingData = {
      ...createBookingDto,
      cognitoSub: createBookingDto.cognitoSub || req.auth.sub,
    };
    
    return this.bookingsService.createBooking(bookingData);
  }

  @Post('decision')
  @UseGuards(OwnerGuard) // Only owners can make booking decisions
  @ApiOperation({ summary: 'Owner decision on booking (Owner only)' })
  @ApiResponse({ status: 200, description: 'Decision processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async makeDecision(@Body(ValidationPipe) decisionDto: BookingDecisionDto) {
    return this.bookingsService.processOwnerDecision(decisionDto);
  }

  @Get(':cognitoSub')
  @UseGuards(ResourceOwnershipGuard) // Users can only access their own bookings
  @ApiOperation({ summary: 'Get user bookings by cognitoSub (Owner only)' })
  @ApiResponse({ status: 200, description: 'List of user bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getBookings(@Param('cognitoSub') cognitoSub: string) {
    return this.bookingsService.getBookings(cognitoSub);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get detailed booking information',
    description: 'Retrieve comprehensive booking details including car information and payment status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed booking information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        cognitoSub: { type: 'string' },
        carId: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        totalPrice: { type: 'number' },
        status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed'] },
        car: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            seats: { type: 'number' },
            pricePerDayCents: { type: 'number' }
          }
        },
        paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingDetails(@Param('id') id: string, @Request() req: RequestWithAuth) {
    const booking = await this.bookingsService.getBookingById(id);
    
    // Ensure the authenticated user can only access their own bookings
    if (booking.cognitoSub !== req.auth.sub) {
      throw new ForbiddenException('Cannot access booking details for other users');
    }
    
    return booking;
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
