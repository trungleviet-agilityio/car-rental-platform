/**
 * KYC Service - Handles KYC document management and verification
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common'; 
import { PrismaService } from '@/shared/database/prisma.service';
import { OnboardingStep, KYCStatus, DocumentType } from '@prisma/client';
import { 
  UploadKYCDocumentsDto, 
  UploadKYCDocumentsResponseDto, 
  GetPresignedUrlDto, 
  PresignedUrlResponseDto 
} from '../dto/upload-document.dto';

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);

  constructor(private prismaService: PrismaService) {}

  async uploadDocuments(dto: UploadKYCDocumentsDto, userId: string): Promise<UploadKYCDocumentsResponseDto> {
    this.logger.log(`Uploading KYC documents for user: ${userId}`);

    // Validate user is in correct onboarding step
    const onboardingProgress = await this.prismaService.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!onboardingProgress || onboardingProgress.currentStep !== OnboardingStep.KYC_UPLOAD) {
      throw new BadRequestException('User must complete profile before uploading documents');
    }

    const verificationId = `kyc_verify_${Date.now()}_${userId}`;

    // Store documents in database
    await this.prismaService.$transaction(async (prisma: any) => {
      // TODO: Create document records when Document table is added to schema
      // For now, just update user status to complete the flow
      
      // Update user KYC status
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: KYCStatus.PENDING },
      });

      // Update onboarding progress
      await prisma.onboardingProgress.update({
        where: { userId },
        data: {
          currentStep: OnboardingStep.KYC_VERIFICATION,
          completedSteps: { push: OnboardingStep.KYC_UPLOAD },
        },
      });
    });

    this.logger.log(`KYC documents uploaded successfully for user: ${userId}`);

    return {
      success: true,
      message: 'Documents uploaded successfully and sent for verification',
      nextStep: OnboardingStep.KYC_VERIFICATION,
      verificationId,
    };
  }

  async getPresignedUrl(dto: GetPresignedUrlDto, userId: string): Promise<PresignedUrlResponseDto> {
    this.logger.log(`Generating presigned URL for user: ${userId}, document: ${dto.documentType}`);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}_${dto.documentType}_${dto.side}_${timestamp}.${dto.fileExtension}`;
    
    // Mock S3 presigned URL (replace with real S3 implementation)
    const mockPresignedUrl = `https://carrentals-documents.s3.amazonaws.com/uploads/${filename}?X-Amz-Expires=3600`;
    const fileUrl = `https://carrentals-documents.s3.amazonaws.com/documents/${filename}`;
    
    return {
      presignedUrl: mockPresignedUrl,
      fileUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      requiredHeaders: {
        'Content-Type': dto.fileExtension === 'pdf' ? 'application/pdf' : 'image/jpeg',
      },
    };
  }

  async getKYCStatus(userId: string) {
    this.logger.log(`Getting KYC status for user: ${userId}`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    // TODO: Implement document table in Prisma schema for Phase 3
    // For now, return mock data to complete the flow
    const documents: any[] = [];

    return {
      kycStatus: user?.kycStatus || KYCStatus.UNVERIFIED,
      documents,
      canUploadMore: user?.kycStatus === KYCStatus.UNVERIFIED || user?.kycStatus === KYCStatus.REJECTED,
    };
  }
}
