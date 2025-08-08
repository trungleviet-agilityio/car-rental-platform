import { Body, Controller, Post } from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { UsersService } from '../users/users.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly aws: AwsService, private readonly users: UsersService) {}

  @Post('upload')
  async upload() {
    return { message: 'KYC upload endpoint (to be implemented)' };
  }

  @Post('presign')
  async presign(@Body() body: any) {
    const cognitoSub = body?.cognitoSub || 'demo-user';
    const bucket = process.env.S3_BUCKET_NAME || '';
    const key = `kyc/${cognitoSub}/${Date.now()}-document.jpg`;

    if (!bucket) {
      // Fallback PoC if bucket not configured
      return {
        uploadUrl: `https://car-rental-storage-demo.s3.amazonaws.com/${key}?X-Amz-Signature=mock`,
        key,
        method: 'PUT',
        expiresIn: 900,
      };
    }

    const presigned = await this.aws.createPresignedPutUrl(bucket, key, body?.contentType || 'image/jpeg');
    await this.users.setKycStatus(cognitoSub, 'pending', key);
    return presigned;
  }

  @Post('validate')
  async validate(@Body() body: any) {
    const cognitoSub = body?.cognitoSub;
    const key = body?.key;
    const stateMachineArn = process.env.KYC_SFN_ARN;
    if (!stateMachineArn) return { error: 'KYC_SFN_ARN not configured' };
    const exec = await this.aws.startKycValidation(stateMachineArn, { cognitoSub, key });
    return { executionArn: exec.executionArn };
  }
}
