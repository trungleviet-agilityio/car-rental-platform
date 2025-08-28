/**
 * Users Controller
 * Handles user-related endpoints for profile management and account activation
 */

import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../application/services/users.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { UserProfileResponseDto, ActivateAccountResponseDto } from '../application/dto/user-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve current user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  async getUserProfile(@CurrentUser('id') userId: string): Promise<UserProfileResponseDto> {
    this.logger.log(`Getting profile for user: ${userId}`);
    return this.usersService.getUserProfile(userId);
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activate user account',
    description: `Activate user account after KYC verification (Phase 4)`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account activated successfully',
    type: ActivateAccountResponseDto,
  })
  async activateAccount(@CurrentUser('id') userId: string): Promise<ActivateAccountResponseDto> {
    this.logger.log(`Activating account for user: ${userId}`);
    return this.usersService.activateAccount(userId);
  }

  @Get('onboarding/progress')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get onboarding progress',
    description: `Get current onboarding progress and completion status`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding progress retrieved successfully',
  })
  async getOnboardingProgress(@CurrentUser('id') userId: string) {
    this.logger.log(`Getting onboarding progress for user: ${userId}`);
    return this.usersService.getOnboardingProgress(userId);
  }
}
