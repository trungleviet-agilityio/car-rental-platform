import { Controller, Post } from '@nestjs/common';

@Controller('kyc')
export class KycController {
  @Post('upload')
  async upload() {
    return { message: 'KYC upload endpoint (to be implemented)' };
  }
}
