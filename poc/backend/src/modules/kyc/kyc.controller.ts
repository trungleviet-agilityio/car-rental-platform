/**
 * KYC controller
 */

import { Inject, Body, Controller, Post, Logger } from '@nestjs/common';
import { STORAGE_PROVIDER, KYC_WORKFLOW } from '../../services/ports/tokens';
import { IStorageProvider } from '../../services/ports/storage.interface';
import { IKycWorkflow } from '../../services/ports/kyc.interface';
import { UsersService } from '../users/users.service';
import { KycPresignDto, KycValidateDto, KycCallbackDto } from './dto/kyc.dto';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    @Inject(KYC_WORKFLOW) private readonly kyc: IKycWorkflow,
    private readonly users: UsersService,
  ) {}

  /**
   * Presign
   * @param body - The presign request
   * @returns The presigned URL
   */
  @Post('presign')
  async presign(@Body() body: KycPresignDto) {
    const { cognitoSub, contentType = 'image/jpeg' } = body;
    const bucket = process.env.S3_BUCKET_NAME || '';
    const key = `kyc/${cognitoSub}/${Date.now()}-document.jpg`;
    
    let presigned;
    if (bucket) {
      presigned = await this.storage.createPresignedPutUrl(bucket, key, contentType);
    } else {
      // Mock URL for development
      presigned = { 
        uploadUrl: `https://car-rental-storage-demo.s3.amazonaws.com/${key}?X-Amz-Signature=mock`, 
        key, 
        method: 'PUT' as const, 
        expiresIn: 900 
      };
    }
    
    await this.users.setKycStatus(cognitoSub, 'pending', key);
    this.logger.log(`KYC presign generated for user ${cognitoSub}`);
    
    return presigned;
  }

  /**
   * Validate
   * @param body - The validation request
   * @returns The validation response
   */
  @Post('validate')
  async validate(@Body() body: KycValidateDto) {
    const arn = process.env.KYC_SFN_ARN;
    if (!arn) {
      return { error: 'KYC_SFN_ARN not configured' };
    }
    
    const exec = await this.kyc.startKycValidation(arn, { 
      cognitoSub: body.cognitoSub, 
      key: body.key 
    });
    
    this.logger.log(`KYC validation started for user ${body.cognitoSub}`);
    return exec;
  }

  /**
   * Callback
   * @param body - The callback request
   * @returns The callback response
   */
  @Post('callback')
  async callback(@Body() body: KycCallbackDto) {
    const user = await this.users.setKycStatus(body.cognitoSub, body.status, body.key);
    this.logger.log(`KYC status updated for user ${body.cognitoSub}: ${body.status}`);
    
    return { 
      cognitoSub: user.cognitoSub, 
      kycStatus: user.kycStatus 
    };
  }
}
