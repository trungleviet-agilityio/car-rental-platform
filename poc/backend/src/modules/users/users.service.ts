/**
 * Users service
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  /**
   * Find user by cognito sub
   * @param cognitoSub - The cognito sub
   * @returns The user or null
   */
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    return this.repo.findOne({ where: { cognitoSub } });
  }

  /**
   * Upsert by cognito sub
   * @param input - The input
   * @returns The user
   */
  async upsertByCognitoSub(input: Partial<User> & { cognitoSub: string }): Promise<User> {
    let user = await this.repo.findOne({ where: { cognitoSub: input.cognitoSub } });
    if (!user) {
      user = this.repo.create({ cognitoSub: input.cognitoSub });
    }
    Object.assign(user, input);
    return this.repo.save(user);
  }

  /**
   * Set KYC status
   * @param cognitoSub - The cognito sub
   * @param status - The status
   * @param kycKey - The KYC key
   * @returns The user
   */
  async setKycStatus(cognitoSub: string, status: User['kycStatus'], kycKey?: string): Promise<User> {
    const user = await this.upsertByCognitoSub({ cognitoSub, kycStatus: status, kycKey });
    return user;
  }
}
