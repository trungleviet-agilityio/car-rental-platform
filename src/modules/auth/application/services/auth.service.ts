/**
 * Auth Service - Main authentication and onboarding orchestration service
 * Coordinates between phone verification, user management, and workflow services
 */

import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/database/prisma.service';
import { OnboardingStep, KYCStatus, UserRole } from '@prisma/client';

// Service interfaces and tokens
import { 
  IPhoneVerificationService,
  IUserManagementService, 
  CreateUserResponse,
  IWorkflowService 
} from '@/core/interfaces/auth';
import {
  PHONE_VERIFICATION_SERVICE,
  USER_MANAGEMENT_SERVICE,
  WORKFLOW_SERVICE,
} from '@/infrastructure/service.tokens';

// DTOs
import { StartSignupDto, StartSignupResponseDto } from '../dto/signup.dto';
import {
  VerifyPhoneDto,
  VerifyPhoneResponseDto,
  SendVerificationCodeDto,
} from '../dto/verify-phone.dto';
import {
  CompleteProfileDto,
  CompleteProfileResponseDto,
} from '../dto/complete-profile.dto';
import { JwtPayload, AuthenticatedUser } from '@/core/types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(PHONE_VERIFICATION_SERVICE)
    private phoneVerificationService: IPhoneVerificationService,
    @Inject(USER_MANAGEMENT_SERVICE)
    private userManagementService: IUserManagementService,
    @Inject(WORKFLOW_SERVICE)
    private workflowService: IWorkflowService,
  ) {}

  /**
   * Start the signup process
   * Creates user in Cognito and database, starts Step Functions workflow
   */
  async startSignup(dto: StartSignupDto): Promise<StartSignupResponseDto> {
    this.logger.debug(`Starting signup process for email: ${dto.email}`);

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'User already exists with this email address',
      );
    }

    let cognitoResult: CreateUserResponse | undefined;

    try {
      // Create user in Cognito
      cognitoResult = await this.userManagementService.createUser({
        email: dto.email,
        password: dto.password,
        phoneNumber: dto.phoneNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tempPassword: false,
      });

      if (!cognitoResult.success) {
        throw new BadRequestException(
          cognitoResult.errorMessage || 'Failed to create user account',
        );
      }

      // Create user in database using transaction
      const user = await this.prismaService.$transaction(async (prisma: any) => {
        // Create user
        const newUser = await prisma.user.create({
          data: {
            email: dto.email,
            cognitoSub: cognitoResult?.cognitoSub || '',
            phoneNumber: dto.phoneNumber,
            firstName: dto.firstName,
            lastName: dto.lastName,
            kycStatus: KYCStatus.UNVERIFIED,
            role: UserRole.RENTER,
          },
        });

        // Create onboarding progress
        await prisma.onboardingProgress.create({
          data: {
            userId: newUser.id,
            currentStep: OnboardingStep.PHONE_VERIFICATION,
            completedSteps: [],
          },
        });

        return newUser;
      });

      // Start Step Functions workflow for onboarding
      const workflowInput = {
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        cognitoSub: user.cognitoSub,
        timestamp: new Date().toISOString(),
      };

      const workflowResult = await this.workflowService.startWorkflow({
        workflowName: 'onboarding',
        input: workflowInput,
        executionName: `onboarding-${user.id}`,
      });

      if (workflowResult.success && workflowResult.executionArn) {
        // Update onboarding progress with execution ARN
        await this.prismaService.onboardingProgress.update({
          where: { userId: user.id },
          data: {
            executionArn: workflowResult.executionArn,
          },
        });
      }

      // Send phone verification if phone number provided
      const nextStep = OnboardingStep.PHONE_VERIFICATION;
      let message = 'Account created successfully.';

      if (dto.phoneNumber) {
        const verificationResult =
          await this.phoneVerificationService.sendVerificationCode(
            dto.phoneNumber,
          );
        if (verificationResult.success) {
          message += ' Please check your phone for verification code.';

          // Store verification record
          await this.prismaService.phoneVerification.create({
            data: {
              userId: user.id,
              phone: dto.phoneNumber,
              verificationSid: verificationResult.verificationSid!,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
          });
        } else {
          this.logger.warn(
            `Failed to send verification code to ${dto.phoneNumber}`,
            verificationResult,
          );
          message += ' Please add your phone number for verification.';
        }
      } else {
        message += ' Please add your phone number for verification.';
      }

      this.logger.log(
        `Signup process started successfully for user: ${user.id}`,
        {
          email: user.email,
          executionArn: workflowResult.executionArn,
        },
      );

      return {
        userId: user.id,
        executionArn: workflowResult.executionArn || '',
        nextStep: nextStep,
        message,
      };
    } catch (error) {
      this.logger.error(`Signup process failed for email: ${dto.email}`, error);

      // Cleanup: Try to delete user from Cognito if database creation failed
      const errorObj = error as any;
      if (errorObj?.name !== 'ConflictException' && cognitoResult?.cognitoSub) {
        try {
          await this.userManagementService.deleteUser({
            cognitoSub: cognitoResult.cognitoSub,
          });
        } catch (cleanupError) {
          this.logger.error(
            'Failed to cleanup Cognito user after signup failure',
            cleanupError,
          );
        }
      }

      throw error;
    }
  }

  /**
   * Send verification code to phone number
   */
  async sendVerificationCode(
    dto: SendVerificationCodeDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(
      `Sending verification code to ${dto.phoneNumber} for user: ${userId}`,
    );

    // Check rate limiting
    const recentAttempts = await this.prismaService.phoneVerification.count({
      where: {
        userId,
        phone: dto.phoneNumber,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentAttempts >= 3) {
      throw new BadRequestException(
        'Too many verification attempts. Please try again later.',
      );
    }

    const result = await this.phoneVerificationService.sendVerificationCode(
      dto.phoneNumber,
    );

    if (result.success && result.verificationSid) {
      // Store verification record
      await this.prismaService.phoneVerification.create({
        data: {
          userId,
          phone: dto.phoneNumber,
          verificationSid: result.verificationSid,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      return {
        success: true,
        message: 'Verification code sent successfully.',
      };
    }

    throw new BadRequestException(
      result.errorMessage || 'Failed to send verification code',
    );
  }

  /**
   * Verify phone number with code
   */
  async verifyPhone(
    dto: VerifyPhoneDto,
    userId?: string,
  ): Promise<VerifyPhoneResponseDto> {
    this.logger.debug(`Verifying phone ${dto.phoneNumber} for user: ${userId || 'public'}`);

    // If no userId provided, find user by phone number
    let actualUserId = userId;
    if (!actualUserId) {
      const user = await this.prismaService.user.findFirst({
        where: { phoneNumber: dto.phoneNumber },
      });
      
      if (!user) {
        throw new BadRequestException(
          'No user found with this phone number',
        );
      }
      actualUserId = user.id;
    }

    // Find the verification record
    const verification = await this.prismaService.phoneVerification.findFirst({
      where: {
        userId: actualUserId,
        phone: dto.phoneNumber,
        status: 'pending',
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException(
        'No pending verification found for this phone number',
      );
    }

    // Verify with Twilio
    const verifyResult = await this.phoneVerificationService.verifyCode(
      dto.phoneNumber,
      dto.code,
    );

    if (!verifyResult.success) {
      // Update attempts
      await this.prismaService.phoneVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      throw new UnauthorizedException(
        verifyResult.errorMessage || 'Invalid verification code',
      );
    }

    if (!verifyResult.valid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Update verification status and user
    await this.prismaService.$transaction(async (prisma: any) => {
      // Mark verification as completed
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      });

      // Update user
      await prisma.user.update({
        where: { id: actualUserId },
        data: {
          phoneNumber: dto.phoneNumber,
        },
      });

      // Update onboarding progress
      await prisma.onboardingProgress.update({
        where: { userId: actualUserId },
        data: {
          currentStep: OnboardingStep.PROFILE_COMPLETION,
          completedSteps: { push: OnboardingStep.PHONE_VERIFICATION },
        },
      });
    });

    // Get updated user data
    const user = await this.prismaService.user.findUnique({
      where: { id: actualUserId },
    });

    if (!user) {
      throw new Error('User not found after verification');
    }

    // Generate JWT token
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      cognitoSub: user.cognitoSub,
      role: user.role,
      phoneNumber: user.phoneNumber || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileCompleted: user.profileCompleted,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };
    
    const token = await this.generateJwtToken(authenticatedUser);

    this.logger.log(`Phone verification successful for user: ${userId}`, {
      phoneNumber: dto.phoneNumber,
    });

    return {
      success: true,
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      nextStep: OnboardingStep.PROFILE_COMPLETION,
      message: 'Phone number verified successfully',
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber!,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileCompleted: user.profileCompleted,
        kycStatus: user.kycStatus,
      },
    };
  }

  /**
   * Complete user profile
   */
  async completeProfile(
    dto: CompleteProfileDto,
    userId: string,
  ): Promise<CompleteProfileResponseDto> {
    this.logger.debug(`Completing profile for user: ${userId}`);

    // Validate age (must be 18+)
    const birthDate = new Date(dto.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      throw new BadRequestException(
        'You must be at least 18 years old to register',
      );
    }

    // Update user profile
    const updatedUser = await this.prismaService.$transaction(async (prisma: any) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: birthDate,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          driverLicense: dto.driverLicense,
          role: dto.role || UserRole.RENTER,
          profileCompleted: true,
        },
      });

      // Update onboarding progress
      await prisma.onboardingProgress.update({
        where: { userId },
        data: {
          currentStep: OnboardingStep.KYC_UPLOAD,
          completedSteps: { push: OnboardingStep.PROFILE_COMPLETION },
        },
      });

      return user;
    });

    this.logger.log(`Profile completed successfully for user: ${userId}`);

    return {
      success: true,
      nextStep: OnboardingStep.KYC_UPLOAD,
      message:
        'Profile completed successfully. Please upload your KYC documents.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber!,
        firstName: updatedUser.firstName!,
        lastName: updatedUser.lastName!,
        profileCompleted: updatedUser.profileCompleted,
        kycStatus: updatedUser.kycStatus,
        role: updatedUser.role,
      },
    };
  }

  /**
   * Get onboarding status for a user
   */
  async getOnboardingStatus(userId: string) {
    const onboardingProgress =
      await this.prismaService.onboardingProgress.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
              profileCompleted: true,
              kycStatus: true,
              role: true,
            },
          },
        },
      });

    if (!onboardingProgress) {
      throw new BadRequestException('Onboarding progress not found');
    }

    return {
      currentStep: onboardingProgress.currentStep,
      completedSteps: onboardingProgress.completedSteps,
      user: onboardingProgress.user,
      executionArn: onboardingProgress.executionArn,
    };
  }

  /**
   * Generate JWT token for user
   */
  private async generateJwtToken(
    user: AuthenticatedUser,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      cognitoSub: user.cognitoSub,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('app.jwt.expiresIn', '1h');
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    // Convert expiration time to seconds
    const expirationSeconds = expiresIn.includes('h')
      ? parseInt(expiresIn) * 3600
      : parseInt(expiresIn);

    return {
      accessToken,
      expiresIn: expirationSeconds,
    };
  }
}
