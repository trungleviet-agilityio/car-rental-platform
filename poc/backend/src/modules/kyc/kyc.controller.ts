/**
 * KYC Controller
 * Handles KYC (Know Your Customer) verification flows
 * Uses Lambda integration for presigned URL generation and Step Functions
 */

import { Body, Controller, Post, Logger, Inject } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import { KycPresignDto, KycCallbackDto, KycValidateDto } from './dto/kyc.dto';
import { LAMBDA_PROVIDER } from '../../interfaces/tokens';
import { ILambdaProvider } from '../../interfaces/lambda.interface';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(
    private readonly storage: StorageService,
    private readonly users: UsersService,
    @Inject(LAMBDA_PROVIDER) private readonly lambda: ILambdaProvider,
  ) {}

  @Post('presign')
  async presign(@Body() body: KycPresignDto) {
    const { cognitoSub, contentType = 'image/jpeg' } = body;
    
    try {
      // Step 10.1.1: Verify user exists (by cognitoSub)
      const user = await this.users.findByCognitoSub(cognitoSub);
      if (!user) {
        throw new Error(`User not found with cognitoSub: ${cognitoSub}`);
      }

      // Step 10.2: Generate Pre-signed URL via Lambda (as per sequence diagram)
      const bucket = process.env.S3_BUCKET_NAME || 'default-bucket';
      const key = `kyc/${cognitoSub}/${Date.now()}-document.jpg`;
      
      const presigned = await this.lambda.generatePresignedUrl({
        userId: cognitoSub,
        bucket,
        key,
        contentType,
        expiresSeconds: 900, // 15 minutes
      });

      // Update user KYC status to pending
      await this.users.setKycStatus(cognitoSub, 'pending', presigned.key);
      
      this.logger.log(`KYC presign generated via Lambda for user ${cognitoSub}`);
      return presigned;
    } catch (error) {
      this.logger.error(`Failed to generate KYC presign for user ${cognitoSub}`, error);
      throw error;
    }
  }

  @Post('validate')
  async validate(@Body() body: KycValidateDto) {
    const { cognitoSub, key } = body;
    
    try {
      // Step 11.1: Validate KYC Documents via Step Functions (as per sequence diagram)
      const bucket = process.env.S3_BUCKET_NAME || 'default-bucket';
      
      const result = await this.lambda.startKycValidation({
        cognitoSub,
        key,
        bucket,
      });

      this.logger.log(`KYC validation started via Step Functions for user ${cognitoSub}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to start KYC validation for user ${cognitoSub}`, error);
      throw error;
    }
  }

  @Post('callback')
  async callback(@Body() body: KycCallbackDto) {
    try {
      // Step 11.4: KYC Validation Status (called by Lambda from Step Functions)
      const user = await this.users.setKycStatus(body.cognitoSub, body.status, body.key);
      this.logger.log(`KYC status updated via Lambda callback for user ${body.cognitoSub}: ${body.status}`);
      
      return { 
        cognitoSub: user.cognitoSub, 
        kycStatus: user.kycStatus 
      };
    } catch (error) {
      this.logger.error(`Failed to update KYC status for user ${body.cognitoSub}`, error);
      throw error;
    }
  }
}