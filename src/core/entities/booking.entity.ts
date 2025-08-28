/**
 * Booking Entity
 * Core domain entity extending Prisma-generated Booking type
 */

import { Booking as PrismaBooking } from '@prisma/client';
import { BookingStatus } from '@prisma/client';

export interface BookingEntity extends Omit<PrismaBooking, 'status'> {
  status: BookingStatus;
}

export class BookingDomainEntity {
  constructor(private booking: BookingEntity) {}

  get id(): string {
    return this.booking.id;
  }

  get status(): BookingStatus {
    return this.booking.status;
  }

  get totalAmountInDollars(): number {
    return Number(this.booking.totalAmount);
  }

  get depositAmountInDollars(): number {
    return this.booking.depositAmount ? Number(this.booking.depositAmount) : 0;
  }

  get durationInDays(): number {
    const start = new Date(this.booking.startDate);
    const end = new Date(this.booking.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  get durationInHours(): number {
    const start = new Date(this.booking.startDate);
    const end = new Date(this.booking.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  get isActive(): boolean {
    return this.booking.status === BookingStatus.ACTIVE;
  }

  get isCompleted(): boolean {
    return this.booking.status === BookingStatus.COMPLETED;
  }

  get isCancelled(): boolean {
    return this.booking.status === BookingStatus.CANCELLED;
  }

  get canBeCancelled(): boolean {
    const now = new Date();
    const startDate = new Date(this.booking.startDate);
    
    // Can cancel if booking hasn't started and is not already cancelled/completed
    return startDate > now && 
           (this.booking.status === BookingStatus.PENDING || 
            this.booking.status === BookingStatus.CONFIRMED);
  }

  get canBeModified(): boolean {
    const now = new Date();
    const startDate = new Date(this.booking.startDate);
    
    // Can modify if booking starts more than 24 hours from now
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilStart > 24 && 
           (this.booking.status === BookingStatus.PENDING || 
            this.booking.status === BookingStatus.CONFIRMED);
  }

  public getLocationInfo() {
    return {
      pickup: {
        location: this.booking.pickupLocation,
        latitude: this.booking.pickupLatitude,
        longitude: this.booking.pickupLongitude,
      },
      dropoff: {
        location: this.booking.dropoffLocation,
        latitude: this.booking.dropoffLatitude,
        longitude: this.booking.dropoffLongitude,
      },
    };
  }

  public toSummaryView() {
    return {
      id: this.booking.id,
      status: this.booking.status,
      startDate: this.booking.startDate,
      endDate: this.booking.endDate,
      duration: {
        days: this.durationInDays,
        hours: this.durationInHours,
      },
      totalAmount: this.totalAmountInDollars,
      depositAmount: this.depositAmountInDollars,
      location: this.getLocationInfo(),
      canBeCancelled: this.canBeCancelled,
      canBeModified: this.canBeModified,
    };
  }
}
