import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async upsertByCognitoSub(input: Partial<User> & { cognitoSub: string }): Promise<User> {
    let user = await this.repo.findOne({ where: { cognitoSub: input.cognitoSub } });
    if (!user) {
      user = this.repo.create({ cognitoSub: input.cognitoSub });
    }
    Object.assign(user, input);
    return this.repo.save(user);
  }

  async setKycStatus(cognitoSub: string, status: User['kycStatus'], kycKey?: string): Promise<User> {
    const user = await this.upsertByCognitoSub({ cognitoSub, kycStatus: status, kycKey });
    return user;
  }
}


