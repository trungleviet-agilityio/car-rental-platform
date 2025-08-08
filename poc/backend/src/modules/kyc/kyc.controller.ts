import { Body, Controller, Post } from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { DbService } from '../db/db.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly aws: AwsService, private readonly db: DbService) {}

  @Post('upload')
  async upload() {
    return { message: 'KYC upload endpoint (to be implemented)' };
  }

  @Post('presign')
  async presign(@Body() body: any) {
    const userId = body?.userId || 'demo-user';
    const bucket = process.env.S3_BUCKET_NAME || '';
    const key = `kyc/${userId}/${Date.now()}-document.jpg`;

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
    this.db.upsertUser({ userId, kycStatus: 'pending', kycKey: key });
    return presigned;
  }
}
