/**
 * Mock KYC provider
 */

import { Logger } from '@nestjs/common';
import { IKycWorkflow } from '../ports/kyc.interface';

export class MockKycProvider implements IKycWorkflow {
  private readonly logger = new Logger(MockKycProvider.name);

  /**
   * Start KYC validation
   * @param stateMachineArn - The state machine ARN
   * @param input - The input
   * @returns The execution ARN
   */
  async startKycValidation(
    stateMachineArn: string, 
    input: { cognitoSub: string; key: string }
  ): Promise<{ executionArn: string }> { 
    this.logger.log(`Mock KYC validation started for user ${input.cognitoSub}`);
    return { executionArn: 'arn:aws:states:mock:execution' }; 
  }
}