/**
 * Enhanced Cars Controller - Secure implementation
 * Implements authentication and authorization following DIP principles
 */

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CarsService } from './cars.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OwnerGuard } from '../../common/guards/owner.guard';

@ApiTags('cars')
@ApiBearerAuth()
@Controller('cars')
@UseGuards(AuthGuard) // Protect all car endpoints with authentication
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available cars' })
  @ApiResponse({ status: 200, description: 'List of cars' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCars() {
    return this.carsService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get car by ID' })
  @ApiResponse({ status: 200, description: 'Car details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Car not found' })
  async getCar(@Param('id') id: string) {
    return this.carsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OwnerGuard) // Only owners can add cars
  @ApiOperation({ summary: 'Add a new car (Owner only)' })
  @ApiResponse({ status: 201, description: 'Car added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async addCar(@Body() createCarDto: CreateCarDto) {
    return this.carsService.addCar(createCarDto);
  }

  @Put(':id')
  @UseGuards(OwnerGuard) // Only owners can update cars
  @ApiOperation({ summary: 'Update car details (Owner only)' })
  @ApiResponse({ status: 200, description: 'Car updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'Car not found' })
  async updateCar(
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto
  ) {
    return this.carsService.updateCar(id, updateCarDto);
  }

  @Delete(':id')
  @UseGuards(OwnerGuard) // Only owners can delete cars
  @ApiOperation({ summary: 'Delete a car (Owner only)' })
  @ApiResponse({ status: 200, description: 'Car deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'Car not found' })
  async deleteCar(@Param('id') id: string) {
    return this.carsService.deleteCar(id);
  }
}
