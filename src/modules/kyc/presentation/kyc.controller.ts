/**
 * KYC Controller
 * Handles KYC-related endpoints for user verification and document management
 */

import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { KYCService } from '../application/services/kyc.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { UploadKYCDocumentsDto, UploadKYCDocumentsResponseDto, GetPresignedUrlDto, PresignedUrlResponseDto } from '../application/dto/upload-document.dto';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KYCController {
  private readonly logger = new Logger(KYCController.name);

  constructor(private readonly kycService: KYCService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for document upload', description: 'Generate a presigned S3 URL for direct document upload' })
  @ApiBody({ type: GetPresignedUrlDto })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully', type: PresignedUrlResponseDto })
  async getPresignedUrl(@Body() dto: GetPresignedUrlDto, @CurrentUser('id') userId: string): Promise<PresignedUrlResponseDto> {
    this.logger.log(`Generating presigned URL for user: ${userId}`);
    return this.kycService.getPresignedUrl(dto, userId);
  }

  @Post('upload-documents')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload KYC documents', description: 'Submit KYC documents for verification after uploading to S3' })
  @ApiBody({ type: UploadKYCDocumentsDto })
  @ApiResponse({ status: 200, description: 'Documents uploaded successfully', type: UploadKYCDocumentsResponseDto })
  async uploadDocuments(@Body() dto: UploadKYCDocumentsDto, @CurrentUser('id') userId: string): Promise<UploadKYCDocumentsResponseDto> {
    this.logger.log(`Uploading documents for user: ${userId}`);
    return this.kycService.uploadDocuments(dto, userId);
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC status', description: 'Get current KYC verification status and uploaded documents' })
  @ApiResponse({ status: 200, description: 'KYC status retrieved successfully' })
  async getKYCStatus(@CurrentUser('id') userId: string) {
    this.logger.log(`Getting KYC status for user: ${userId}`);
    return this.kycService.getKYCStatus(userId);
  }
}
