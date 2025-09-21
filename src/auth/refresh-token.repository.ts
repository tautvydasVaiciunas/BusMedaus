import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>
  ) {}

  private getRepo(manager?: EntityManager): Repository<RefreshToken> {
    return manager ? manager.getRepository(RefreshToken) : this.repository;
  }

  create(data: Partial<RefreshToken>, manager?: EntityManager): RefreshToken {
    return this.getRepo(manager).create(data);
  }

  save(token: RefreshToken, manager?: EntityManager): Promise<RefreshToken> {
    return this.getRepo(manager).save(token);
  }

  findByTokenId(tokenId: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { tokenId }, relations: ['user'] });
  }

  findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({ where: { user: { id: userId } }, relations: ['user'] });
  }

  async revoke(token: RefreshToken): Promise<RefreshToken> {
    token.revoked = true;
    return this.repository.save(token);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const tokens = await this.findByUserId(userId);
    for (const token of tokens) {
      if (!token.revoked) {
        token.revoked = true;
        await this.repository.save(token);
      }
    }
  }
}
