/**
 * User Management Service Interface
 * Abstract interface for user management operations with different identity providers
 */

export interface CreateUserRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  tempPassword?: boolean;
}

export interface CreateUserResponse {
  success: boolean;
  userId: string;
  cognitoSub?: string;
  temporaryPassword?: boolean;
  errorMessage?: string;
}

export interface UpdateUserAttributesRequest {
  cognitoSub: string;
  attributes: Record<string, string>;
}

export interface UpdateUserAttributesResponse {
  success: boolean;
  errorMessage?: string;
}

export interface DeleteUserRequest {
  cognitoSub: string;
}

export interface DeleteUserResponse {
  success: boolean;
  errorMessage?: string;
}

export interface SetUserPasswordRequest {
  cognitoSub: string;
  password: string;
  permanent?: boolean;
}

export interface SetUserPasswordResponse {
  success: boolean;
  errorMessage?: string;
}

export interface IUserManagementService {
  /**
   * Create a new user in the identity provider
   * @param request User creation request
   * @returns Promise with creation result
   */
  createUser(request: CreateUserRequest): Promise<CreateUserResponse>;

  /**
   * Update user attributes in the identity provider
   * @param request Update request with attributes
   * @returns Promise with update result
   */
  updateUserAttributes(
    request: UpdateUserAttributesRequest,
  ): Promise<UpdateUserAttributesResponse>;

  /**
   * Delete a user from the identity provider
   * @param request Delete request
   * @returns Promise with deletion result
   */
  deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse>;

  /**
   * Set user password (useful for temporary passwords)
   * @param request Password set request
   * @returns Promise with result
   */
  setUserPassword(
    request: SetUserPasswordRequest,
  ): Promise<SetUserPasswordResponse>;

  /**
   * Enable or disable a user
   * @param cognitoSub User's Cognito sub
   * @param enabled Whether to enable or disable
   * @returns Promise with result
   */
  setUserEnabled(
    cognitoSub: string,
    enabled: boolean,
  ): Promise<{ success: boolean; errorMessage?: string }>;

  /**
   * Health check for the user management service
   * @returns Promise with health status
   */
  healthCheck(): Promise<{ status: string; timestamp: Date }>;
}
