/**
 * Cars Controller
 */

import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OwnerGuard } from '../../common/guards/owner.guard';

@Controller('cars')
@UseGuards(AuthGuard)
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

  @Post()
  @UseGuards(OwnerGuard)
  async add(@Body() body: CreateCarDto) {
    return this.cars.addCar(body);
  }

  @Put(':id')
  @UseGuards(OwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCarDto,
  ) {
    return this.cars.updateCar(id, body);
  }
}
