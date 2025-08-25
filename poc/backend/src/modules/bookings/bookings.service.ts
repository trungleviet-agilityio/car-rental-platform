/**
 * Bookings Service - Implementation following sequence diagrams with DIP
 * Implements: Booking Creation → Owner Notification → Owner Decision → Renter Notification → Payment
 */

import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CarsService } from '../cars/cars.service';
import { NOTIFICATION_PROVIDER, PAYMENT_PROVIDER, LAMBDA_PROVIDER } from '../../interfaces/tokens';
import { INotificationProvider } from '../../interfaces/notification.interface';
import { IPaymentProvider } from '../../interfaces/payment.interface';
import { ILambdaProvider } from '../../interfaces/lambda.interface';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDecisionDto } from './dto/decision.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly cars: CarsService,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: IPaymentProvider,
    @Inject(LAMBDA_PROVIDER) private readonly lambdaProvider: ILambdaProvider,
  ) {}

  // Step 7-10: Booking Creation Flow (from sequence diagram)
  async createBooking(createBookingDto: CreateBookingDto) {
    // 1. Get car details (Step 4-5 from sequence diagram)
    const car = await this.cars.findById(createBookingDto.carId);
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // 2. Create booking transaction (Step 8 from sequence diagram)
    const booking = this.repo.create({
      carId: createBookingDto.carId,
      cognitoSub: createBookingDto.cognitoSub || 'unknown', // Will be populated by JWT in production
      startDate: new Date(createBookingDto.startDate),
      endDate: new Date(createBookingDto.endDate),
      status: 'pending',
      totalPrice: createBookingDto.totalPrice,
      notificationRetryCount: 0,
    });

    const savedBooking = await this.repo.save(booking);

    // 3. Notify owner with retry logic (Step 10-13 from sequence diagram)
    // Use Lambda integration for notifications as per sequence diagram
    await this.notifyOwnerViaLambda(car, savedBooking, createBookingDto.owner);

    // 4. Return booking confirmation (Step 14)
    return {
      message: 'Booking created successfully',
      booking: savedBooking,
      car: car,
      status: 'pending_owner_decision'
    };
  }

  async getBookings(cognitoSub: string) {
    return this.repo.find({
      where: { cognitoSub },
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingById(id: string) {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  // Owner Decision Flow (from sequence diagram 2)
  async processOwnerDecision(decisionDto: BookingDecisionDto) {
    const booking = await this.getBookingById(decisionDto.bookingId);
    
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    // Update booking with owner decision
    booking.ownerDecision = decisionDto.decision;
    booking.ownerDecisionAt = new Date();
    booking.status = decisionDto.decision; // 'accepted' or 'rejected'
    
    await this.repo.save(booking);

    // Notify renter about decision via Lambda (as per sequence diagram)
    await this.notifyRenterViaLambda(booking, decisionDto.renter);

    return {
      message: `Booking ${decisionDto.decision} successfully`,
      booking,
      renterNotified: true
    };
  }

  // Payment Integration (Steps 15-17 from sequence diagram)
  async createPaymentIntent(bookingId: string) {
    const booking = await this.getBookingById(bookingId);
    
    if (booking.status !== 'accepted') {
      throw new BadRequestException('Booking must be accepted before payment');
    }

    const paymentIntent = await this.paymentProvider.createPaymentIntent(
      booking.totalPrice,
      'usd',
      {
        bookingId: booking.id,
        carId: booking.carId,
      }
    );

    // Store payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await this.repo.save(booking);

    return paymentIntent;
  }

  async confirmPayment(bookingId: string, paymentIntentId: string, paymentMethodId: string) {
    const booking = await this.getBookingById(bookingId);
    
    if (booking.paymentIntentId !== paymentIntentId) {
      throw new BadRequestException('Payment intent mismatch');
    }

    const payment = await this.paymentProvider.confirmPayment(
      paymentIntentId,
      paymentMethodId
    );

    if (payment.status === 'succeeded') {
      booking.status = 'paid';
      await this.repo.save(booking);
      
      return {
        message: 'Payment confirmed successfully',
        booking,
        payment
      };
    }

    throw new BadRequestException('Payment confirmation failed');
  }

  private calculatePrice(pricePerDayCents: number, startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days * pricePerDayCents;
  }

  // Owner Notification with Retry Logic (Steps 10-13 from sequence diagram)
  private async notifyOwnerWithRetry(car: any, booking: Booking, ownerOverride?: { email?: string; phone?: string }) {
    const maxRetries = 3;
    const message = `New booking for car ${car.id} from ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}. Please respond with accept/reject.`;
    
    // Use override if provided, otherwise use car owner info
    const ownerEmail = ownerOverride?.email || car.owner?.email;
    const ownerPhone = ownerOverride?.phone || car.owner?.phone;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Notification attempt ${attempt}/${maxRetries} for booking ${booking.id}`);
        
        if (ownerEmail) {
          await this.notifier.sendEmail({
            to: ownerEmail,
            subject: 'New Car Booking - Action Required',
            text: message,
          });
          
          await this.repo.update(booking.id, { 
            notificationStatus: 'email_success',
            notificationRetryCount: attempt 
          });
          
          this.logger.log(`Owner notified via email for booking ${booking.id} on attempt ${attempt}`);
          return;
        } else if (ownerPhone) {
          await this.notifier.sendSms({
            to: ownerPhone,
            message: message,
          });
          
          await this.repo.update(booking.id, { 
            notificationStatus: 'sms_success',
            notificationRetryCount: attempt 
          });
          
          this.logger.log(`Owner notified via SMS for booking ${booking.id} on attempt ${attempt}`);
          return;
        }
      } catch (error) {
        this.logger.error(`Notification attempt ${attempt} failed for booking ${booking.id}`, error);
        
        if (attempt === maxRetries) {
          // Final fallback - try email if SMS failed or vice versa
          try {
            if (ownerEmail && booking.notificationStatus?.includes('sms_failed')) {
              await this.notifier.sendEmail({
                to: ownerEmail,
                subject: 'New Car Booking - Action Required (Fallback)',
                text: `${message} (SMS delivery failed, fallback to email)`,
              });
              
              await this.repo.update(booking.id, { 
                notificationStatus: 'email_success',
                notificationRetryCount: attempt 
              });
              
              this.logger.log(`Fallback email notification successful for booking ${booking.id}`);
              return;
            }
          } catch (fallbackError) {
            this.logger.error(`Fallback notification failed for booking ${booking.id}`, fallbackError);
          }
          
          await this.repo.update(booking.id, { 
            notificationStatus: 'email_failed',
            notificationRetryCount: attempt 
          });
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
  }

  // Renter Notification after Owner Decision
  private async notifyRenterDecision(booking: Booking, renterOverride?: { email?: string; phone?: string }) {
    const message = booking.ownerDecision === 'accepted' 
      ? `Good news! Your booking for car ${booking.carId} has been accepted. You can now proceed with payment.`
      : `Sorry, your booking for car ${booking.carId} has been rejected.`;
    
    try {
      if (renterOverride?.email) {
        await this.notifier.sendEmail({
          to: renterOverride.email,
          subject: `Booking ${booking.ownerDecision === 'accepted' ? 'Accepted' : 'Rejected'}`,
          text: message,
        });
        
        booking.renterNotificationStatus = 'email_success';
        await this.repo.save(booking);
        
        this.logger.log(`Renter notified via email about decision for booking ${booking.id}`);
      } else if (renterOverride?.phone) {
        await this.notifier.sendSms({
          to: renterOverride.phone,
          message: message,
        });
        
        booking.renterNotificationStatus = 'sms_success';
        await this.repo.save(booking);
        
        this.logger.log(`Renter notified via SMS about decision for booking ${booking.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to notify renter about decision for booking ${booking.id}`, error);
      booking.renterNotificationStatus = 'email_failed';
      await this.repo.save(booking);
    }
  }

  // Lambda-based Owner Notification (as per sequence diagram)
  private async notifyOwnerViaLambda(car: any, booking: Booking, ownerOverride?: { email?: string; phone?: string }) {
    const message = `New booking for car ${car.id} from ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}. Please respond with accept/reject.`;
    
    // Use override if provided, otherwise use car owner info
    const ownerEmail = ownerOverride?.email || car.owner?.email || 'owner@example.com';
    const ownerPhone = ownerOverride?.phone || car.owner?.phone;
    
    try {
      this.logger.log(`Triggering Lambda notification for booking ${booking.id}`);
      
      // Call Lambda function for notification (Step 10-11 from sequence diagram)
      const lambdaResponse = await this.lambdaProvider.callExternalService({
        url: '/notify/booking-owner',
        method: 'POST',
        data: {
          bookingId: booking.id,
          carId: booking.carId,
          ownerEmail,
          ownerPhone,
          message,
          booking: {
            startDate: booking.startDate.toISOString(),
            endDate: booking.endDate.toISOString(),
            totalPrice: booking.totalPrice,
            cognitoSub: booking.cognitoSub
          }
        }
      });

      if (lambdaResponse.success) {
        await this.repo.update(booking.id, { 
          notificationStatus: 'email_success',
          notificationRetryCount: 1 
        });
        this.logger.log(`Lambda notification successful for booking ${booking.id}`);
      } else {
        throw new Error(`Lambda notification failed: ${lambdaResponse.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      this.logger.error(`Lambda notification failed for booking ${booking.id}`, error);
      
      // Fallback to direct notification
      this.logger.log(`Falling back to direct notification for booking ${booking.id}`);
      await this.notifyOwnerWithRetry(car, booking, ownerOverride);
    }
  }

  // Lambda-based Renter Notification after Owner Decision
  private async notifyRenterViaLambda(booking: Booking, renterOverride?: { email?: string; phone?: string }) {
    const message = booking.ownerDecision === 'accepted' 
      ? `Good news! Your booking for car ${booking.carId} has been accepted. You can now proceed with payment.`
      : `Sorry, your booking for car ${booking.carId} has been rejected.`;
    
    try {
      this.logger.log(`Triggering Lambda renter notification for booking ${booking.id}`);
      
      // Call Lambda function for renter notification
      const lambdaResponse = await this.lambdaProvider.callExternalService({
        url: '/notify/booking-renter',
        method: 'POST',
        data: {
          bookingId: booking.id,
          carId: booking.carId,
          decision: booking.ownerDecision,
          renterEmail: renterOverride?.email || 'renter@example.com',
          renterPhone: renterOverride?.phone,
          message,
          booking: {
            startDate: booking.startDate.toISOString(),
            endDate: booking.endDate.toISOString(),
            totalPrice: booking.totalPrice,
            cognitoSub: booking.cognitoSub
          }
        }
      });

      if (lambdaResponse.success) {
        booking.renterNotificationStatus = 'email_success';
        await this.repo.save(booking);
        this.logger.log(`Lambda renter notification successful for booking ${booking.id}`);
      } else {
        throw new Error(`Lambda renter notification failed: ${lambdaResponse.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      this.logger.error(`Lambda renter notification failed for booking ${booking.id}`, error);
      
      // Fallback to direct notification
      await this.notifyRenterDecision(booking, renterOverride);
    }
  }
}
