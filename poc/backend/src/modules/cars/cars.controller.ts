/**
 * Cars Controller - Simple POC implementation
 */

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CarsService } from './cars.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available cars' })
  @ApiResponse({ status: 200, description: 'List of cars' })
  async getCars() {
    return this.carsService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get car by ID' })
  @ApiResponse({ status: 200, description: 'Car details' })
  async getCar(@Param('id') id: string) {
    return this.carsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new car' })
  @ApiResponse({ status: 201, description: 'Car added successfully' })
  async addCar(@Body() body: {
    make: string;
    model: string;
    seats: number;
    pricePerDayCents: number;
    depositCents?: number;
    owner?: { email?: string; phone?: string };
  }) {
    return this.carsService.addCar(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update car details' })
  @ApiResponse({ status: 200, description: 'Car updated successfully' })
  async updateCar(
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.carsService.updateCar(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a car' })
  @ApiResponse({ status: 200, description: 'Car deleted successfully' })
  async deleteCar(@Param('id') id: string) {
    return this.carsService.deleteCar(id);
  }
}
