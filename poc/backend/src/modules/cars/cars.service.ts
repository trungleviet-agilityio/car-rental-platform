/**
 * Cars Service - returns a static list for PoC
 */

import { Inject, Injectable } from '@nestjs/common';
import { CARS_PROVIDER } from '../../interfaces/tokens';
import { ICarCatalogProvider } from '../../interfaces/cars.interface';

@Injectable()
export class CarsService {
  /**
   * Cars Service
   * @param catalog - The cars catalog provider
   */

  constructor(@Inject(CARS_PROVIDER) private readonly catalog: ICarCatalogProvider) {}

  /**
   * List all cars
   * @returns A list of car summaries
   */
  list() {
    return this.catalog.listCars();
  }

  /**
   * Find a car by ID
   * @param id - The car ID
   * @returns The car summary
   */
  findById(id: string) {
    return this.catalog.getCarById(id);
  }
}
