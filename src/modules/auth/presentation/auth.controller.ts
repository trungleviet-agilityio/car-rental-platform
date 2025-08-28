/**
 * Auth Controller - Authentication and onboarding endpoints
 * Handles user signup, phone verification, and profile completion
 */

import {
  Controller,
  Post,
  Get,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '../application/services/auth.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { Public } from '@/shared/decorators/public.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/core/types/auth.types';

// DTOs
import { StartSignupDto, StartSignupResponseDto } from '../application/dto/signup.dto';
import {
  VerifyPhoneDto,
  VerifyPhoneResponseDto,
  SendVerificationCodeDto,
} from '../application/dto/verify-phone.dto';
import {
  CompleteProfileDto,
  CompleteProfileResponseDto,
} from '../application/dto/complete-profile.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(JwtAuthGuard) // Apply JWT guard by default
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public() // Mark as public route
  @Post('signup/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start user signup process',
    description: `Initiates the user onboarding workflow by creating account in Cognito and database,
      and then starting Step Functions workflow`,
  })
  @ApiBody({ type: StartSignupDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Signup process started successfully',
    type: StartSignupResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
        message: {
          type: 'string',
          example: 'Password does not meet requirements',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.CONFLICT },
        message: {
          type: 'string',
          example: 'User already exists with this email address',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async startSignup(
    @Body() startSignupDto: StartSignupDto,
  ): Promise<StartSignupResponseDto> {
    this.logger.log(`Starting signup for email: ${startSignupDto.email}`);
    return this.authService.startSignup(startSignupDto);
  }

  @Post('phone/send-code')
  @HttpCode(HttpStatus.OK)  
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send phone verification code',
    description: `Sends a verification code to the provided phone number via SMS`,
  })
  @ApiBody({ type: SendVerificationCodeDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Verification code sent successfully.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to send verification code or rate limited',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
        message: {
          type: 'string',
          example: 'Too many verification attempts. Please try again later.',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async sendVerificationCode(
    @Body() sendCodeDto: SendVerificationCodeDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Sending verification code to ${sendCodeDto.phoneNumber} for user: ${userId}`,
    );
    return this.authService.sendVerificationCode(sendCodeDto, userId);
  }

  @Public() // Allow both authenticated and unauthenticated users
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify phone number',
    description: `Verifies the phone number using the SMS code and returns JWT token on success`,
  })
  @ApiBody({ type: VerifyPhoneDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone verification successful',
    type: VerifyPhoneResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No pending verification or invalid code',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
        message: {
          type: 'string',
          example: 'No pending verification found for this phone number',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid verification code',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.UNAUTHORIZED },
        message: { type: 'string', example: 'Invalid verification code' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async verifyPhone(
    @Body() verifyPhoneDto: VerifyPhoneDto,
    @CurrentUser('id') userId?: string,
  ): Promise<VerifyPhoneResponseDto> {
    this.logger.log(
      `Verifying phone ${verifyPhoneDto.phoneNumber} for user: ${userId || 'public'}`,
    );
    return this.authService.verifyPhone(verifyPhoneDto, userId);
  }

  @Post('profile/complete')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete user profile',
    description: `Completes the user profile with personal information and address details`,
  })
  @ApiBody({ type: CompleteProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile completed successfully',
    type: CompleteProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid profile data or age restriction',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
        message: {
          type: 'string',
          example: 'You must be at least 18 years old to register',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async completeProfile(
    @Body() completeProfileDto: CompleteProfileDto,
    @CurrentUser('id') userId: string,
  ): Promise<CompleteProfileResponseDto> {
    this.logger.log(`Completing profile for user: ${userId}`);
    return this.authService.completeProfile(completeProfileDto, userId);
  }

  @Get('onboarding/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get onboarding status',
    description: `Returns the current onboarding progress and user information`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currentStep: { type: 'string', example: 'PROFILE_COMPLETION' },
        completedSteps: {
          type: 'array',
          items: { type: 'string' },
          example: ['PHONE_VERIFICATION'],
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clr2k3j4a0000a1b2c3d4e5f6' },
            email: { type: 'string', example: 'user@example.com' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            profileCompleted: { type: 'boolean', example: false },
            kycStatus: { type: 'string', example: 'UNVERIFIED' },
            role: { type: 'string', example: 'RENTER' },
          },
        },
        executionArn: {
          type: 'string',
          example:
            'arn:aws:states:us-east-1:123456789012:execution:onboarding:clr2k3j4a0000a1b2c3d4e5f6',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Onboarding progress not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
        message: { type: 'string', example: 'Onboarding progress not found' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async getOnboardingStatus(@CurrentUser('id') userId: string) {
    this.logger.log(`Getting onboarding status for user: ${userId}`);
    return this.authService.getOnboardingStatus(userId);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: `Returns the authenticated user profile information`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clr2k3j4a0000a1b2c3d4e5f6' },
        email: { type: 'string', example: 'user@example.com' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        profileCompleted: { type: 'boolean', example: true },
        kycStatus: { type: 'string', example: 'VERIFIED' },
        role: { type: 'string', example: 'RENTER' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Getting profile for user: ${user.id}`);
    
    // Remove sensitive fields before returning
    const { cognitoSub: _, ...userProfile } = user;
    return userProfile;
  }
}
