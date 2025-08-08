import { Body, Controller, Post, Get } from '@nestjs/common';

@Controller('kyc')
export class KycController {
  @Post('upload')
  async upload() {
    return { message: 'KYC upload endpoint (to be implemented)' };
  }

  @Post('presign')
  async presign(@Body() body: any) {
    const userId = body?.userId || 'demo-user';
    const key = `kyc/${userId}/${Date.now()}-document.jpg`;
    // PoC: return a mock pre-signed URL
    return {
      uploadUrl: `https://car-rental-storage-demo.s3.amazonaws.com/${key}?X-Amz-Signature=mock`,
      key,
      method: 'PUT',
      expiresIn: 900,
    };
  }
}
