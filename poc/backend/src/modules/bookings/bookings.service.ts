/**
 * Bookings Service
 * Orchestrates booking creation, owner notification with retry/fallback, and payment confirmation.
 * Depends only on abstractions where it matters (payments/notifications).
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { NOTIFICATION_PROVIDER } from '../../interfaces/tokens';
import { INotificationProvider } from '../../interfaces/notification.interface';
import { PaymentService } from '../payment/payment.service';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider,
    private readonly payments: PaymentService,
    private readonly cars: CarsService,
  ) {}

  async listBookings(cognitoSub: string) {
    return this.repo.find({ where: { cognitoSub }, order: { createdAt: 'DESC' } });
  }

  async createBooking(params: {
    cognitoSub: string;
    carId: string;
    startDate: string;
    endDate: string;
    totalPrice: number; // cents
    ownerContact?: { email?: string; phone?: string };
  }) {
    const booking = this.repo.create({
      cognitoSub: params.cognitoSub,
      carId: params.carId,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      totalPrice: params.totalPrice,
      status: 'pending',
      notificationStatus: 'none',
    });
    const saved = await this.repo.save(booking);

    const car = this.cars.findById(params.carId);
    if (!car) throw new Error('Car not found');

    const owner = params.ownerContact || car.owner;

    await this.notifyOwnerWithRetry(owner, saved);

    return saved;
  }

  async ownerDecision(
    bookingId: string,
    decision: 'accepted' | 'rejected',
    renter?: { email?: string; phone?: string },
  ) {
    const booking = await this.repo.findOne({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');

    if (decision === 'accepted') {
      // Pre-authorize deposit
      const depositCents = this.cars.getPreauthDepositCents(booking.carId);
      if (depositCents > 0) {
        await this.payments.createPaymentIntent(depositCents, 'USD', {
          type: 'preauth',
          bookingId: booking.id,
          carId: booking.carId,
        });
      }
      await this.repo.update({ id: booking.id }, { status: 'confirmed' });
      await this.notifyRenter(renter, `Your booking ${booking.id} has been accepted.`);
      return { status: 'accepted', bookingId };
    }

    // Rejected
    await this.repo.update({ id: booking.id }, { status: 'cancelled' });
    await this.notifyRenter(renter, `Your booking ${booking.id} was rejected.`);
    return { status: 'rejected', bookingId };
  }

  private async notifyOwnerWithRetry(owner: { email?: string; phone?: string } | undefined, booking: Booking) {
    if (!owner) return;
    const message = `New booking for car ${booking.carId} from ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}.`;

    // Retry up to 3 times for SMS; fallback to Email once
    let smsOk = false;
    if (owner.phone) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.notifier.sendSms({ to: owner.phone, message });
          smsOk = true;
          await this.updateNotificationStatus(booking.id, 'sms_success');
          break;
        } catch (err) {
          this.logger.warn(`SMS attempt ${attempt} failed for booking ${booking.id}: ${err?.message}`);
          if (attempt === 3) {
            await this.updateNotificationStatus(booking.id, 'sms_failed');
          }
        }
      }
    }

    if (!smsOk && owner.email) {
      try {
        await this.notifier.sendEmail({ to: owner.email, subject: 'New Booking', text: message });
        await this.updateNotificationStatus(booking.id, 'email_success');
      } catch (err) {
        await this.updateNotificationStatus(booking.id, 'email_failed');
        this.logger.error(`Email fallback failed for booking ${booking.id}: ${err?.message}`);
      }
    }
  }

  private async notifyRenter(renter: { email?: string; phone?: string } | undefined, message: string) {
    if (!renter) return;
    if (renter.phone) {
      try { await this.notifier.sendSms({ to: renter.phone, message }); return; } catch {}
    }
    if (renter.email) {
      try { await this.notifier.sendEmail({ to: renter.email, subject: 'Booking Update', text: message }); } catch {}
    }
  }

  private async updateNotificationStatus(id: string, status: Booking['notificationStatus']) {
    await this.repo.update({ id }, { notificationStatus: status });
  }

  async confirmBooking(id: string) {
    await this.repo.update({ id }, { status: 'confirmed' });
    return this.repo.findOne({ where: { id } });
  }

  async createPaymentIntent(bookingId: string) {
    const booking = await this.repo.findOne({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    const intent = await this.payments.createPaymentIntent(booking.totalPrice, 'USD', { bookingId });
    return intent;
  }

  async confirmPayment(bookingId: string, paymentIntentId: string, paymentMethodId: string) {
    const result = await this.payments.confirmPayment(paymentIntentId, paymentMethodId);
    if (result.status === 'succeeded') {
      await this.repo.update({ id: bookingId }, { status: 'paid' });
    }
    return result;
  }
}
