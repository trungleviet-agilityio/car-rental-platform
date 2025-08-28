/**
 * Hub Entity
 * Core domain entity extending Prisma-generated Hub type
 */

import { Hub as PrismaHub } from '@prisma/client';
import { HubType } from '@prisma/client';

/**
 * Hub Entity
 * Represents a physical location where vehicles can be picked up/dropped off
 */
export class Hub {
  id: string;
  name: string;
  address: string;
  location: string; // PostGIS POINT
  operatingHours: Record<string, any>; // Daily schedule
  totalParkingSpots: number;
  availableSpots: number;
  discountPercentage: number;
  hubType: HubType;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: PrismaHub) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.location = data.location;
    this.operatingHours = data.operatingHours as Record<string, any>;
    this.totalParkingSpots = data.totalParkingSpots;
    this.availableSpots = data.availableSpots;
    this.discountPercentage = Number(data.discountPercentage);
    this.hubType = data.hubType;
    this.contactPhone = data.contactPhone || undefined;
    this.contactEmail = data.contactEmail || undefined;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt || undefined;
  }

  /**
   * Check if hub has available parking spots
   */
  get hasAvailableSpots(): boolean {
    return this.availableSpots > 0;
  }

  /**
   * Get parking utilization percentage
   */
  get parkingUtilization(): number {
    return ((this.totalParkingSpots - this.availableSpots) / this.totalParkingSpots) * 100;
  }

  /**
   * Check if hub is open at given time
   */
  isOpenAt(date: Date): boolean {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const time = date.toTimeString().slice(0, 5); // HH:MM format
    
    const daySchedule = this.operatingHours[dayOfWeek];
    if (!daySchedule || !daySchedule.isOpen) return false;
    
    return time >= daySchedule.openTime && time <= daySchedule.closeTime;
  }

  /**
   * Get discount amount for a booking
   */
  getDiscountAmount(bookingAmount: number): number {
    return (bookingAmount * this.discountPercentage) / 100;
  }
}
