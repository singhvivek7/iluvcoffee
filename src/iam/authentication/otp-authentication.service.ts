import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib';

@Injectable()
export class OtpAuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const appName = this.configService.getOrThrow('TFA_APP_NAME');
    const uri = authenticator.keyuri(email, appName, secret);

    return { secret, uri };
  }

  verifyCode(code: string, secret: string) {
    return authenticator.verify({ secret, token: code });
  }

  async enableTfaForUser(email: string, secret: string) {
    const { id } = await this.usersRepository.findOneOrFail({
      where: { email },
      select: {
        id: true,
      },
    });

    //TODO: hash secret

    await this.usersRepository.update(id, {
      isTfaEnabled: true,
      tfaSecret: secret,
    });
  }
}
