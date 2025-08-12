/**
 * Users controller
 */

import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Sync
   * @param body - The body
   * @returns The sync response
   */
  @Post('sync')
  async sync(
    @Body()
    body: { cognitoSub: string; username?: string; phoneNumber?: string; email?: string },
  ) {
    const user = await this.users.upsertByCognitoSub(body);
    return { id: user.id, cognitoSub: user.cognitoSub };
  }
}
