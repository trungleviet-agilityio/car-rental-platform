/**
 * KYC controller
 */

import { Inject, Body, Controller, Post } from '@nestjs/common';
import { STORAGE_PROVIDER, KYC_WORKFLOW } from '../../services/ports/tokens';
import { IStorageProvider } from '../../services/ports/storage.interface';
import { IKycWorkflow } from '../../services/ports/kyc.interface';
import { UsersService } from '../users/users.service';

@Controller('kyc')
export class KycController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    @Inject(KYC_WORKFLOW) private readonly kyc: IKycWorkflow,
    private readonly users: UsersService,
  ) {}

  /**
   * Presign
   * @param body - The body
   * @returns The presigned URL
   */
  @Post('presign')
  async presign(@Body() body: any) {
    const cognitoSub = body?.cognitoSub || 'demo-user';
    const bucket = process.env.S3_BUCKET_NAME || '';
    const key = `kyc/${cognitoSub}/${Date.now()}-document.jpg`;
    const presigned = bucket ? await this.storage.createPresignedPutUrl(bucket, key, body?.contentType || 'image/jpeg') :
      { uploadUrl: `https://car-rental-storage-demo.s3.amazonaws.com/${key}?X-Amz-Signature=mock`, key, method: 'PUT', expiresIn: 900 };
    await this.users.setKycStatus(cognitoSub, 'pending', key);
    return presigned;
  }

  /**
   * Validate
   * @param body - The body
   * @returns The validation response
   */
  @Post('validate')
  async validate(@Body() body: any) {
    const arn = process.env.KYC_SFN_ARN;
    if (!arn) return { error: 'KYC_SFN_ARN not configured' };
    const exec = await this.kyc.startKycValidation(arn, { cognitoSub: body?.cognitoSub, key: body?.key });
    return exec;
  }

  /**
   * Callback
   * @param body - The body
   * @returns The callback response
   */
  @Post('callback')
  async callback(@Body() body: { cognitoSub: string; key: string; status: 'verified' | 'rejected' }) {
    const user = await this.users.setKycStatus(body.cognitoSub, body.status, body.key);
    return { cognitoSub: user.cognitoSub, kycStatus: user.kycStatus };
  }
}
