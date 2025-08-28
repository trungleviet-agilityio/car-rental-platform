/**
 * Mock User Management Service for Phase 1
 * Simple implementation for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class MockUserManagementService implements IUserManagementService {
  private readonly logger = new Logger(MockUserManagementService.name);

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.logger.log(`[MOCK] Creating user: ${request.email}`);
    
    const mockCognitoSub = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockUserId = `user_${Date.now()}`;
    
    return {
      success: true,
      userId: mockUserId,
      cognitoSub: mockCognitoSub,
      temporaryPassword: request.tempPassword,
    };
  }

  async updateUserAttributes(request: UpdateUserAttributesRequest): Promise<UpdateUserAttributesResponse> {
    this.logger.log(`[MOCK] Updating user attributes: ${request.cognitoSub}`);
    
    return {
      success: true,
    };
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    this.logger.log(`[MOCK] Deleting user: ${request.cognitoSub}`);
    
    return {
      success: true,
    };
  }

  async setUserPassword(request: SetUserPasswordRequest): Promise<SetUserPasswordResponse> {
    this.logger.log(`[MOCK] Setting password for user: ${request.cognitoSub}`);
    
    return {
      success: true,
    };
  }

  async setUserEnabled(cognitoSub: string, enabled: boolean): Promise<{ success: boolean }> {
    this.logger.log(`[MOCK] Setting user enabled status: ${cognitoSub} to ${enabled}`);
    
    return {
      success: true,
    };
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  }
} 