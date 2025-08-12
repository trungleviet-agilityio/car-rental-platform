/**
 * Mock KYC provider
 */

import { IKycWorkflow } from '../ports/kyc.interface';

export class MockKycProvider implements IKycWorkflow {
  /**
   * Start KYC validation
   * @param _ - The state machine ARN
   * @param __ - The input
   * @returns The execution ARN
   */
  async startKycValidation(_: string, __: any) { return { executionArn: 'arn:aws:states:mock:execution' }; }
}