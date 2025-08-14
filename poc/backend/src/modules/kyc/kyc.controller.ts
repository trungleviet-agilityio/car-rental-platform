/**
 * KYC Controller
 * Handles KYC (Know Your Customer) verification flows
 * Uses StorageService and UsersService for business logic
 */

import { Body, Controller, Post, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import { KycPresignDto, KycCallbackDto } from './dto/kyc.dto';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(
    private readonly storage: StorageService,
    private readonly users: UsersService,
  ) {}

  @Post('presign')
  async presign(@Body() body: KycPresignDto) {
    const { cognitoSub, contentType = 'image/jpeg' } = body;
    
    try {
      const presigned = await this.storage.createKycUploadUrl(cognitoSub, contentType);
      await this.users.setKycStatus(cognitoSub, 'pending', presigned.key);
      
      this.logger.log(`KYC presign generated for user ${cognitoSub}`);
      return presigned;
    } catch (error) {
      this.logger.error(`Failed to generate KYC presign for user ${cognitoSub}`, error);
      throw error;
    }
  }

  @Post('callback')
  async callback(@Body() body: KycCallbackDto) {
    try {
      const user = await this.users.setKycStatus(body.cognitoSub, body.status, body.key);
      this.logger.log(`KYC status updated for user ${body.cognitoSub}: ${body.status}`);
      
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