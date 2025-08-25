/**
 * Enhanced KYC Controller - Secure implementation
 * Handles KYC (Know Your Customer) verification flows with proper security
 * Uses Lambda integration for presigned URL generation and Step Functions
 */

import { Body, Controller, Post, Logger, Inject, UseGuards } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import { KycPresignDto, KycCallbackDto, KycValidateDto } from './dto/kyc.dto';
import { LAMBDA_PROVIDER } from '../../interfaces/tokens';
import { ILambdaProvider } from '../../interfaces/lambda.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ResourceOwnershipGuard } from '../../common/guards/resource-ownership.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(AuthGuard) // Protect all KYC endpoints with authentication
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(
    private readonly storage: StorageService,
    private readonly users: UsersService,
    @Inject(LAMBDA_PROVIDER) private readonly lambda: ILambdaProvider,
  ) {}

  @Post('presign')
  @UseGuards(ResourceOwnershipGuard) // Users can only access KYC for themselves
  @ApiOperation({ summary: 'Generate presigned URL for KYC document upload (Owner only)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access KYC for other users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async presign(@Body() body: KycPresignDto) {
    const { cognitoSub, contentType = 'image/jpeg' } = body;
    try {
      const user = await this.users.findByCognitoSub(cognitoSub);
      if (!user) {
        throw new Error(`User not found with cognitoSub: ${cognitoSub}`);
      }

      // Generate presigned URL using Lambda integration
      const presignedResult = await this.lambda.generatePresignedUrl({
        userId: cognitoSub,
        bucket: 'kyc-documents',
        key: `kyc/${cognitoSub}/${Date.now()}.${contentType.split('/')[1]}`,
        contentType,
        expiresSeconds: 3600, // 1 hour
      });

      this.logger.log(`KYC presigned URL generated for user ${cognitoSub}`);
      return {
        message: 'Presigned URL generated successfully',
        presignedUrl: presignedResult.uploadUrl,
        documentKey: presignedResult.key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate KYC presign for user ${cognitoSub}`, error);
      throw error;
    }
  }

  @Post('validate')
  @UseGuards(ResourceOwnershipGuard) // Users can only validate KYC for themselves
  @ApiOperation({ summary: 'Validate KYC documents (Owner only)' })
  @ApiResponse({ status: 200, description: 'KYC validation initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot validate KYC for other users' })
  async validate(@Body() body: KycValidateDto) {
    const { cognitoSub, key } = body;
    
    try {
      // Trigger KYC validation via Lambda and Step Functions
      const validationResult = await this.lambda.startKycValidation({
        cognitoSub,
        key,
        bucket: 'kyc-documents',
      });

      this.logger.log(`KYC validation triggered for user ${cognitoSub}`);
      return {
        message: 'KYC validation initiated successfully',
        executionArn: validationResult.executionArn,
        status: validationResult.status,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger KYC validation for user ${cognitoSub}`, error);
      throw error;
    }
  }

  @Post('callback')
  @ApiOperation({ summary: 'KYC validation callback (Internal use)' })
  @ApiResponse({ status: 200, description: 'KYC callback processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid callback data' })
  async callback(@Body() body: KycCallbackDto) {
    const { cognitoSub, key, status } = body;
    
    try {
      // Process KYC validation result
      this.logger.log(`KYC callback received for user ${cognitoSub} with status ${status}`);
      
      // Update user KYC status (this would typically be handled by the service)
      // For now, we'll just log the callback
      return {
        message: 'KYC callback processed successfully',
        cognitoSub,
        status,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to process KYC callback for user ${cognitoSub}`, error);
      throw error;
    }
  }
}