/**
 * AWS KYC adapter
 */

import { Injectable } from '@nestjs/common';
import { IKycWorkflow } from '../../../services/ports/kyc.interface';
import { AwsService } from '../aws.service';

@Injectable()
export class AwsKycAdapter implements IKycWorkflow {
  constructor(private readonly aws: AwsService) {}

  /**
   * Start KYC validation
   * @param stateMachineArn - The state machine ARN
   * @param input - The input
   * @returns The execution ARN
   */
  async startKycValidation(
    stateMachineArn: string,
    input: { cognitoSub: string; key: string },
  ): Promise<{ executionArn: string }> {
    const res = await this.aws.startKycValidation(stateMachineArn, input);
    return { executionArn: res.executionArn as string };
  }
}
