/**
 * Vehicle Entity
 * Represents a vehicle available for rental with complete business logic
 */

import { Vehicle as PrismaVehicle, FuelType, TransmissionType } from '@prisma/client';

/**
 * Vehicle Entity
 * Represents a vehicle available for rental with complete business logic
 */
export class Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  seats: number;
  hourlyPriceCents?: number;
  dailyPriceCents: number;
  depositCents: number;
  minRentalHours: number;
  maxRentalHours: number;
  photos: Record<string, any>; // Array of S3 URLs
  insuranceDetails?: Record<string, any>;
  location?: string; // PostGIS POINT
  address?: string;
  isAvailable: boolean;
  availabilityCalendar?: Record<string, any>;
  fuelType: FuelType;
  transmission: TransmissionType;
  features: Record<string, any>; // Array of features
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: PrismaVehicle) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.make = data.make;
    this.model = data.model;
    this.year = data.year;
    this.licensePlate = data.licensePlate;
    this.seats = data.seats;
    this.hourlyPriceCents = data.hourlyPriceCents || undefined;
    this.dailyPriceCents = data.dailyPriceCents;
    this.depositCents = data.depositCents;
    this.minRentalHours = data.minRentalHours;
    this.maxRentalHours = data.maxRentalHours;
    this.photos = data.photos as Record<string, any>;
    this.insuranceDetails = data.insuranceDetails as Record<string, any> || undefined;
    this.location = data.location || undefined;
    this.address = data.address || undefined;
    this.isAvailable = data.isAvailable;
    this.availabilityCalendar = data.availabilityCalendar as Record<string, any> || undefined;
    this.fuelType = data.fuelType;
    this.transmission = data.transmission;
    this.features = data.features as Record<string, any>;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt || undefined;
  }

  /**
   * Get display name for the vehicle
   */
  get displayName(): string {
    return `${this.year} ${this.make} ${this.model}`;
  }

  /**
   * Get daily rate in dollars
   */
  get dailyRate(): number {
    return this.dailyPriceCents / 100;
  }

  /**
   * Get hourly rate in dollars
   */
  get hourlyRate(): number | null {
    return this.hourlyPriceCents ? this.hourlyPriceCents / 100 : null;
  }

  /**
   * Get deposit amount in dollars
   */
  get depositAmount(): number {
    return this.depositCents / 100;
  }

  /**
   * Get location coordinates
   */
  get coordinates(): { latitude: number; longitude: number } | null {
    if (!this.location) return null;
    
    // Parse PostGIS POINT format: "POINT(longitude latitude)"
    const match = this.location.match(/POINT\(([^)]+)\)/);
    if (!match) return null;
    
    const [longitude, latitude] = match[1].split(' ').map(Number);
    return { latitude, longitude };
  }

  /**
   * Get vehicle specifications
   */
  get specifications(): {
    make: string;
    model: string;
    year: number;
    fuelType: FuelType;
    transmission: TransmissionType;
    seats: number;
  } {
    return {
      make: this.make,
      model: this.model,
      year: this.year,
      fuelType: this.fuelType,
      transmission: this.transmission,
      seats: this.seats,
    };
  }

  /**
   * Check if vehicle can be booked by a specific user
   */
  canBeBookedBy(userId: string): boolean {
    return this.isAvailable && this.ownerId !== userId;
  }

  /**
   * Get vehicle listing view
   */
  getListingView() {
    return {
      id: this.id,
      displayName: this.displayName,
      dailyRate: this.dailyRate,
      hourlyRate: this.hourlyRate,
      depositAmount: this.depositAmount,
      location: {
        address: this.address,
        coordinates: this.coordinates,
      },
      specifications: this.specifications,
      features: this.features,
      photos: this.photos,
      isAvailable: this.isAvailable,
      minRentalHours: this.minRentalHours,
      maxRentalHours: this.maxRentalHours,
    };
  }

  /**
   * Get vehicle details view
   */
  getDetailsView() {
    return {
      ...this.getListingView(),
      ownerId: this.ownerId,
      licensePlate: this.licensePlate,
      insuranceDetails: this.insuranceDetails,
      availabilityCalendar: this.availabilityCalendar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
