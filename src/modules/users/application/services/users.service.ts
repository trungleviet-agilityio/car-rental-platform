/**
 * Users Service - Handles user profile management and account activation
 */

import { 
  Injectable, 
  Logger, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { KYCStatus, OnboardingStep } from '@prisma/client';
import { UserProfileResponseDto, ActivateAccountResponseDto } from '../dto/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prismaService: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    this.logger.log(`Getting profile for user: ${userId}`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      profileCompleted: user.profileCompleted,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async activateAccount(userId: string): Promise<ActivateAccountResponseDto> {
    this.logger.log(`Activating account for user: ${userId}`);

    // Verify user exists and KYC is verified
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { onboardingProgress: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kycStatus !== KYCStatus.VERIFIED) {
      throw new BadRequestException('Account cannot be activated until KYC is verified');
    }

    if (user.isActive) {
      return {
        success: true,
        message: 'Account is already active',
        user: await this.getUserProfile(userId),
      };
    }

    // Activate the account
    const updatedUser = await this.prismaService.$transaction(async (prisma: any) => {
      // Update user status
      const activatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      // Complete onboarding
      await prisma.onboardingProgress.update({
        where: { userId },
        data: {
          currentStep: OnboardingStep.COMPLETED,
          completedSteps: { push: OnboardingStep.ACCOUNT_ACTIVATION },
          completedAt: new Date(),
        },
      });

      return activatedUser;
    });

    this.logger.log(`Account activated successfully for user: ${userId}`);

    return {
      success: true,
      message: 'Account activated successfully! Welcome to CarRental Platform.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber || '',
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        kycStatus: updatedUser.kycStatus,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
      },
    };
  }

  async getOnboardingProgress(userId: string) {
    this.logger.log(`Getting onboarding progress for user: ${userId}`);

    const onboardingProgress = await this.prismaService.onboardingProgress.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
            profileCompleted: true,
            kycStatus: true,
            isActive: true,
          },
        },
      },
    });

    if (!onboardingProgress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    return {
      currentStep: onboardingProgress.currentStep,
      completedSteps: onboardingProgress.completedSteps,
      completedAt: onboardingProgress.completedSteps.includes(OnboardingStep.ACCOUNT_ACTIVATION) ? new Date() : undefined,
      user: onboardingProgress.user,
      progressPercentage: this.calculateProgressPercentage(onboardingProgress.completedSteps),
    };
  }

  private calculateProgressPercentage(completedSteps: OnboardingStep[]): number {
    const totalSteps = Object.values(OnboardingStep).length - 1; // Exclude ACCOUNT_ACTIVATED
    return Math.round((completedSteps.length / totalSteps) * 100);
  }
}

