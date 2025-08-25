/**
 * Enhanced Payment Controller - Secure implementation
 * Handles payment processing via DIP payment providers with proper security
 */

import { Body, Controller, Post, Get, Param, Logger, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(AuthGuard) // Protect all payment endpoints with authentication
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPaymentIntent(@Body() body: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }) {
    return this.paymentService.createPaymentIntent(body.amount, body.currency, body.metadata);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 201, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment confirmation data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async confirmPayment(@Body() body: {
    paymentIntentId: string;
    paymentMethodId: string;
  }) {
    return this.paymentService.confirmPayment(body.paymentIntentId, body.paymentMethodId);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refundPayment(@Body() body: {
    paymentIntentId: string;
    amount?: number;
  }) {
    return this.paymentService.refundPayment(body.paymentIntentId, body.amount);
  }

  @Get('status/:paymentIntentId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentService.getPaymentStatus(paymentIntentId);
  }
}
