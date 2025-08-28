/**
 * Infrastructure Module
 * Module for all infrastructure services and implementations
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Auth Infrastructure
import { CognitoService } from './auth/cognito.service';
import { MockUserManagementService } from './auth/mock-user-management.service';

// Communication Infrastructure  
import { TwilioVerifyService } from './communication/twilio-verify.service';
import { MockPhoneVerificationService } from './communication/mock-phone-verification.service';

// Workflow Infrastructure  
import { MockWorkflowService } from './workflows/mock-workflow.service';
import { StepFunctionsService } from './workflows/step-functions.service';

// Service Tokens
import {
  PHONE_VERIFICATION_SERVICE,
  USER_MANAGEMENT_SERVICE,
  WORKFLOW_SERVICE,
} from './service.tokens';

function createServiceProvider(
  token: symbol,
  productionService: any,
  mockService: any,
  configKey: string,
) {
  return {
    provide: token,
    useFactory: (configService: ConfigService) => {
      const environment = configService.get<string>('NODE_ENV');
      
      // For Phase 1, always use mock services in development
      if (environment === 'development' || environment === 'test') {
        return new mockService(configService);
      }
      return new productionService(configService);
    },
    inject: [ConfigService],
  };
}

@Module({
  providers: [
    // Phase 1: Basic services for user registration and phone verification
    createServiceProvider(
      PHONE_VERIFICATION_SERVICE,
      TwilioVerifyService,
      MockPhoneVerificationService,
      'NOTIFICATION_PROVIDER'
    ),
    createServiceProvider(
      USER_MANAGEMENT_SERVICE,
      CognitoService,
      MockUserManagementService,
      'AUTH_PROVIDER'
    ),
    createServiceProvider(
      WORKFLOW_SERVICE,
      StepFunctionsService,
      MockWorkflowService,
      'WORKFLOW_PROVIDER'
    ),

    // Concrete services (for direct injection if needed)
    TwilioVerifyService,
    MockPhoneVerificationService,
    CognitoService,
    MockUserManagementService,
    StepFunctionsService,
    MockWorkflowService,
  ],
  exports: [
    PHONE_VERIFICATION_SERVICE,
    USER_MANAGEMENT_SERVICE,
    WORKFLOW_SERVICE,
  ],
})
export class InfrastructureModule {}
