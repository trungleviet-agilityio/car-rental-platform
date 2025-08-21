/**
 * Cars Controller
 */

import { Controller, Get, Param } from '@nestjs/common';
import { CarsService } from './cars.service';

@Controller('cars')
export class CarsController {
  /**
   * Cars Controller
   * @param cars - The cars service
   */

  constructor(private readonly cars: CarsService) {}

  @Get()
  async list() {
    return this.cars.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.cars.findById(id);
  }
}
