/**
 * Vehicle Entity
 * Core domain entity extending Prisma-generated Vehicle type
 */

import { Vehicle as PrismaVehicle, VehicleStatus, FuelType, TransmissionType } from '@prisma/client';

export interface VehicleEntity extends PrismaVehicle {
  status: VehicleStatus;
  fuelType: FuelType;
  transmission: TransmissionType;
}

export class VehicleDomainEntity {
  constructor(private vehicle: VehicleEntity) {}

  get id(): string {
    return this.vehicle.id;
  }

  get displayName(): string {
    return `${this.vehicle.year} ${this.vehicle.make} ${this.vehicle.model}`;
  }

  get isAvailable(): boolean {
    return this.vehicle.status === VehicleStatus.AVAILABLE;
  }

  get dailyRateInDollars(): number {
    return Number(this.vehicle.dailyRate);
  }

  get hourlyRateInDollars(): number | null {
    return this.vehicle.hourlyRate ? Number(this.vehicle.hourlyRate) : null;
  }

  get location(): { address?: string; latitude?: number; longitude?: number } {
    return {
      address: this.vehicle.location || undefined,
      latitude: this.vehicle.latitude || undefined,
      longitude: this.vehicle.longitude || undefined,
    };
  }

  get specifications(): {
    make: string;
    model: string;
    year: number;
    fuelType: FuelType;
    transmission: TransmissionType;
    seats: number;
    mileage: number;
  } {
    return {
      make: this.vehicle.make,
      model: this.vehicle.model,
      year: this.vehicle.year,
      fuelType: this.vehicle.fuelType,
      transmission: this.vehicle.transmission,
      seats: this.vehicle.seats,
      mileage: this.vehicle.mileage,
    };
  }

  public canBeBookedBy(userId: string): boolean {
    return this.isAvailable && this.vehicle.ownerId !== userId;
  }

  public toListingView() {
    return {
      id: this.vehicle.id,
      displayName: this.displayName,
      dailyRate: this.dailyRateInDollars,
      hourlyRate: this.hourlyRateInDollars,
      location: this.location,
      specifications: this.specifications,
      features: this.vehicle.features,
      images: this.vehicle.images,
      status: this.vehicle.status,
    };
  }
}
