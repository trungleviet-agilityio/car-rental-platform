/**
 * Cars Service - Simple POC implementation
 */

import { Injectable } from '@nestjs/common';

export interface CarItem {
  id: string;
  make: string;
  model: string;
  seats: number;
  pricePerDayCents: number;
  depositCents?: number;
  owner?: { email?: string; phone?: string };
}

@Injectable()
export class CarsService {
  private cars: CarItem[] = [
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

  list(): CarItem[] {
    return this.cars;
  }

  findById(id: string): CarItem | null {
    return this.cars.find((car) => car.id === id) || null;
  }

  getOwnerContact(id: string): { email?: string; phone?: string } | undefined {
    return this.findById(id)?.owner;
  }

  getPreauthDepositCents(id: string): number {
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
    const id = `car-${Date.now()}`;
    const car: CarItem = { id, ...input };
    this.cars.push(car);
    return car;
  }

  updateCar(id: string, input: Partial<Omit<CarItem, 'id'>>): CarItem {
    const car = this.findById(id);
    if (!car) throw new Error('Car not found');
    
    Object.assign(car, input);
    return car;
  }

  deleteCar(id: string): boolean {
    const index = this.cars.findIndex((car) => car.id === id);
    if (index === -1) return false;
    
    this.cars.splice(index, 1);
    return true;
  }
}
