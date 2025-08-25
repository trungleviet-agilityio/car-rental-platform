/**
 * Enhanced Users Controller - Secure implementation
 * Handles user management with proper authentication
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard) // Protect all user endpoints with authentication
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Sync user data with authentication system
   * @param body - User sync data
   * @returns The sync response
   */
  @Post('sync')
  @ApiOperation({ summary: 'Sync user data with authentication system' })
  @ApiResponse({ status: 200, description: 'User synced successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sync(
    @Body()
    body: { cognitoSub: string; username?: string; phoneNumber?: string; email?: string },
  ) {
    const user = await this.users.upsertByCognitoSub(body);
    return { id: user.id, cognitoSub: user.cognitoSub };
  }
}
