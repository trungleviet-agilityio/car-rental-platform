/**
 * Booking Entity
 * Represents a vehicle rental booking with complete business logic
 */

import { Booking as PrismaBooking, BookingStatus } from '@prisma/client';

export interface BookingEntity extends Omit<PrismaBooking, 'status'> {
  status: BookingStatus;
}

/**
 * Booking Entity
 * Represents a vehicle rental booking with complete business logic
 */
export class Booking {
  id: string;
  renterId: string;
  vehicleId: string;
  ownerId: string;
  startDatetime: Date;
  endDatetime: Date;
  pickupLocation?: string; // PostGIS POINT
  returnLocation?: string; // PostGIS POINT
  hubId?: string;
  status: BookingStatus;
  pricingBreakdown: Record<string, any>; // rental_fee, deposit, commission
  totalAmountCents: number;
  commissionCents: number;
  hubDiscountCents: number;
  bookingNotes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: PrismaBooking) {
    this.id = data.id;
    this.renterId = data.renterId;
    this.vehicleId = data.vehicleId;
    this.ownerId = data.ownerId;
    this.startDatetime = data.startDatetime;
    this.endDatetime = data.endDatetime;
    this.pickupLocation = data.pickupLocation || undefined;
    this.returnLocation = data.returnLocation || undefined;
    this.hubId = data.hubId || undefined;
    this.status = data.status;
    this.pricingBreakdown = data.pricingBreakdown as Record<string, any>;
    this.totalAmountCents = data.totalAmountCents;
    this.commissionCents = data.commissionCents;
    this.hubDiscountCents = data.hubDiscountCents;
    this.bookingNotes = data.bookingNotes || undefined;
    this.cancellationReason = data.cancellationReason || undefined;
    this.cancelledBy = data.cancelledBy || undefined;
    this.cancelledAt = data.cancelledAt || undefined;
    this.confirmedAt = data.confirmedAt || undefined;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt || undefined;
  }

  /**
   * Get total amount in dollars
   */
  get totalAmount(): number {
    return this.totalAmountCents / 100;
  }

  /**
   * Get deposit amount in dollars
   */
  get depositAmount(): number {
    const deposit = this.pricingBreakdown?.deposit;
    return deposit ? Number(deposit) / 100 : 0;
  }

  /**
   * Calculate rental duration in hours
   */
  get durationHours(): number {
    const start = new Date(this.startDatetime);
    const end = new Date(this.endDatetime);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Calculate rental duration in days
   */
  get durationDays(): number {
    const start = new Date(this.startDatetime);
    const end = new Date(this.endDatetime);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if booking is active
   */
  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if booking is completed
   */
  get isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  /**
   * Check if booking is cancelled
   */
  get isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  /**
   * Check if booking is pending
   */
  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Check if booking is confirmed
   */
  get isConfirmed(): boolean {
    return this.status === 'CONFIRMED';
  }

  /**
   * Get pickup location coordinates
   */
  get pickupCoordinates(): { latitude: number; longitude: number } | null {
    if (!this.pickupLocation) return null;
    
    // Parse PostGIS POINT format: "POINT(longitude latitude)"
    const match = this.pickupLocation.match(/POINT\(([^)]+)\)/);
    if (!match) return null;
    
    const [longitude, latitude] = match[1].split(' ').map(Number);
    return { latitude, longitude };
  }

  /**
   * Get return location coordinates
   */
  get returnCoordinates(): { latitude: number; longitude: number } | null {
    if (!this.returnLocation) return null;
    
    // Parse PostGIS POINT format: "POINT(longitude latitude)"
    const match = this.returnLocation.match(/POINT\(([^)]+)\)/);
    if (!match) return null;
    
    const [longitude, latitude] = match[1].split(' ').map(Number);
    return { latitude, longitude };
  }

  /**
   * Get booking summary
   */
  getSummary() {
    return {
      id: this.id,
      startDate: this.startDatetime,
      endDate: this.endDatetime,
      duration: this.durationHours,
      totalAmount: this.totalAmount,
      status: this.status,
      isActive: this.isActive,
    };
  }
}
