import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from 'src/users/api-keys/entities/api-key.entity';
import { Repository } from 'typeorm';
import { REQUEST_USER_KEY } from 'src/iam/iam.constants';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';

export const API_KEY = 'ApiKey';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey = this.extractApiKeyFromHeader(request);
    if (!apiKey) {
      throw new UnauthorizedException();
    }

    const apiKeyEntityId = this.apiKeysService.extractIdFromApiKey(apiKey);

    try {
      const apiKeyEntity = await this.apiKeyRepository.findOne({
        where: { uuid: apiKeyEntityId },
        relations: {
          user: true,
        },
      });
      await this.apiKeysService.validate(apiKey, apiKeyEntity.key);
      request[REQUEST_USER_KEY] = {
        sub: apiKeyEntity.user.id,
        email: apiKeyEntity.user.email,
        role: apiKeyEntity.user.role,
        permissions: apiKeyEntity.user.permissions,
      } as ActiveUserData;
    } catch (err) {
      throw new UnauthorizedException();
    }

    return true;
  }

  extractApiKeyFromHeader(request: Request): string | undefined {
    const [type, apiKey] = request.headers.authorization?.split(' ');
    return type === API_KEY ? apiKey : undefined;
  }
}
