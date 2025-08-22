/**
 * Cars Service - static in-memory catalog for PoC
 */

import { Injectable } from '@nestjs/common';
import { CarItem } from './interfaces/car.interface';

@Injectable()
export class CarsService {
  private readonly cars: CarItem[] = [
    {
      id: 'car-1',
      make: 'Toyota',
      model: 'Corolla',
      seats: 5,
      pricePerDayCents: 4500,
      depositCents: 10000,
      owner: { email: 'owner1@example.com' },
    },
    {
      id: 'car-2',
      make: 'Honda',
      model: 'Civic',
      seats: 5,
      pricePerDayCents: 5000,
      depositCents: 15000,
      owner: { phone: '+12025550123' },
    },
  ];

  list() {
    return this.cars;
  }

  findById(id: string) {
    return this.cars.find((c) => c.id === id) || null;
  }

  getOwnerContact(id: string) {
    return this.findById(id)?.owner;
  }

  getPreauthDepositCents(id: string) {
    return this.findById(id)?.depositCents || 0;
  }

  addCar(input: {
    make: string;
    model: string;
    seats: number;
    pricePerDayCents: number;
    depositCents?: number;
    owner?: { email?: string; phone?: string };
  }): CarItem {
    const id = `car-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const car: CarItem = {
      id,
      make: input.make,
      model: input.model,
      seats: input.seats,
      pricePerDayCents: input.pricePerDayCents,
      depositCents: input.depositCents ?? 0,
      owner: input.owner,
    };
    this.cars.push(car);
    return car;
  }

  updateCar(id: string, input: Partial<Omit<CarItem, 'id'>>): CarItem {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error('Car not found');
    }
    Object.assign(existing, input);
    return existing;
  }
}
