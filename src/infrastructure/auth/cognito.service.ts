/**
 * AWS Cognito User Management Service
 * Implements IUserManagementService for AWS Cognito identity provider
 */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AdminEnableUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AdminDisableUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { MessageActionType } from '@aws-sdk/client-cognito-identity-provider';

import { 
  IUserManagementService,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserAttributesRequest,
  UpdateUserAttributesResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  SetUserPasswordRequest,
  SetUserPasswordResponse,
} from '@/core/interfaces/auth/user-management.interface';
import { logError, getErrorMessage } from '@/shared/utils/error-handler';

@Injectable()
export class CognitoService implements IUserManagementService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('app.aws.region');
    this.userPoolId = this.configService.get<string>(
      'app.aws.cognito.userPoolId',
    ) || 'mock-user-pool-id';

    if (!region || !this.userPoolId) {
      throw new Error(
        'AWS Cognito configuration is missing. Please check your environment variables.',
      );
    }

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
    });
  }

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      this.logger.debug(`Creating user in Cognito: ${request.email}`);

      // Prepare user attributes
      const userAttributes: AttributeType[] = [
        { Name: 'email', Value: request.email },
        { Name: 'email_verified', Value: 'true' }, // We'll verify via our own flow
      ];

      if (request.phoneNumber) {
        userAttributes.push({
          Name: 'phone_number',
          Value: request.phoneNumber,
        });
      }

      if (request.firstName) {
        userAttributes.push({ Name: 'given_name', Value: request.firstName });
      }

      if (request.lastName) {
        userAttributes.push({ Name: 'family_name', Value: request.lastName });
      }

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: request.email, // Using email as username
        UserAttributes: userAttributes,
        TemporaryPassword: request.password,
        MessageAction: MessageActionType.SUPPRESS, // We handle our own notifications
        ForceAliasCreation: false,
      });

      const response = await this.cognitoClient.send(command);

      if (!response.User?.Username) {
        throw new Error('Failed to create user - no username returned');
      }

      this.logger.log(
        `User created successfully in Cognito: ${request.email}`,
        {
          cognitoSub: response.User.Username,
          userStatus: response.User.UserStatus,
        },
      );

      // If temporary password, we need to set it as permanent
      if (!request.tempPassword) {
        await this.setUserPassword({
          cognitoSub: response.User.Username,
          password: request.password,
          permanent: true,
        });
      }

      return {
        success: true,
        userId: response.User.Username,
        cognitoSub: response.User.Username,
        temporaryPassword: request.tempPassword,
      };
    } catch (error) {
      const awsError = error as any;
      logError(error, `Failed to create user in Cognito: ${request.email}`);

      // Handle specific Cognito errors
      if (awsError?.name === 'UsernameExistsException') {
        return {
          success: false,
          userId: '',
          errorMessage: 'User already exists with this email address.',
        };
      }

      if (awsError?.name === 'InvalidPasswordException') {
        return {
          success: false,
          userId: '',
          errorMessage: 'Password does not meet requirements.',
        };
      }

      if (awsError?.name === 'InvalidParameterException') {
        return {
          success: false,
          userId: '',
          errorMessage: 'Invalid user data provided.',
        };
      }

      throw new InternalServerErrorException(
        'User creation service temporarily unavailable',
      );
    }
  }

  async updateUserAttributes(
    request: UpdateUserAttributesRequest,
  ): Promise<UpdateUserAttributesResponse> {
    try {
      this.logger.debug(
        `Updating user attributes in Cognito: ${request.cognitoSub}`,
      );

      const userAttributes: AttributeType[] = Object.entries(
        request.attributes,
      ).map(([name, value]) => ({
        Name: name,
        Value: value,
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: request.cognitoSub,
        UserAttributes: userAttributes,
      });

      await this.cognitoClient.send(command);

      this.logger.log(
        `User attributes updated successfully in Cognito: ${request.cognitoSub}`,
        {
          attributesUpdated: Object.keys(request.attributes),
        },
      );

      return {
        success: true,
      };
    } catch (error) {
      const awsError = error as any;
      this.logger.error(
        `Failed to update user attributes in Cognito: ${request.cognitoSub}`,
        {
          error: getErrorMessage(error),
          code: awsError?.name,
        },
      );

      if (awsError?.name === 'UserNotFoundException') {
        return {
          success: false,
          errorMessage: 'User not found.',
        };
      }

      return {
        success: false,
        errorMessage: 'Failed to update user attributes.',
      };
    }
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    try {
      this.logger.debug(`Deleting user in Cognito: ${request.cognitoSub}`);

      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: request.cognitoSub,
      });

      await this.cognitoClient.send(command);

      this.logger.log(
        `User deleted successfully in Cognito: ${request.cognitoSub}`,
      );

      return {
        success: true,
      };
    } catch (error) {
      const awsError = error as any;
      this.logger.error(
        `Failed to delete user in Cognito: ${request.cognitoSub}`,
        {
          error: getErrorMessage(error),
          code: awsError?.name,
        },
      );

      if (awsError?.name === 'UserNotFoundException') {
        return {
          success: false,
          errorMessage: 'User not found.',
        };
      }

      return {
        success: false,
        errorMessage: 'Failed to delete user.',
      };
    }
  }

  async setUserPassword(
    request: SetUserPasswordRequest,
  ): Promise<SetUserPasswordResponse> {
    try {
      this.logger.debug(
        `Setting user password in Cognito: ${request.cognitoSub}`,
      );

      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: request.cognitoSub,
        Password: request.password,
        Permanent: request.permanent ?? true,
      });

      await this.cognitoClient.send(command);

      this.logger.log(
        `User password set successfully in Cognito: ${request.cognitoSub}`,
        {
          permanent: request.permanent,
        },
      );

      return {
        success: true,
      };
    } catch (error) {
      const awsError = error as any;
      this.logger.error(
        `Failed to set user password in Cognito: ${request.cognitoSub}`,
        {
          error: getErrorMessage(error),
          code: awsError?.name,
        },
      );

      if (awsError?.name === 'UserNotFoundException') {
        return {
          success: false,
          errorMessage: 'User not found.',
        };
      }

      if (awsError?.name === 'InvalidPasswordException') {
        return {
          success: false,
          errorMessage: 'Password does not meet requirements.',
        };
      }

      return {
        success: false,
        errorMessage: 'Failed to set user password.',
      };
    }
  }

  async setUserEnabled(
    cognitoSub: string,
    enabled: boolean,
  ): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      this.logger.debug(
        `${enabled ? 'Enabling' : 'Disabling'} user in Cognito: ${cognitoSub}`,
      );

      const command = enabled
        ? new AdminEnableUserCommand({
            UserPoolId: this.userPoolId,
            Username: cognitoSub,
          })
        : new AdminDisableUserCommand({
            UserPoolId: this.userPoolId,
            Username: cognitoSub,
          });

      await this.cognitoClient.send(command);

      this.logger.log(
        `User ${enabled ? 'enabled' : 'disabled'} successfully in Cognito: ${cognitoSub}`,
      );

      return {
        success: true,
      };
    } catch (error) {
      const awsError = error as any;
      this.logger.error(
        `Failed to ${enabled ? 'enable' : 'disable'} user in Cognito: ${cognitoSub}`,
        {
          error: getErrorMessage(error),
          code: awsError?.name,
        },
      );

      if (awsError?.name === 'UserNotFoundException') {
        return {
          success: false,
          errorMessage: 'User not found.',
        };
      }

      return {
        success: false,
        errorMessage: `Failed to ${enabled ? 'enable' : 'disable'} user.`,
      };
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Test by describing the user pool
      const command = new DescribeUserPoolCommand({
        UserPoolId: this.userPoolId,
      });

      await this.cognitoClient.send(command);

      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      const awsError = error as any;
      this.logger.error('Cognito health check failed', error);
      throw new Error('Cognito service unavailable');
    }
  }
}
