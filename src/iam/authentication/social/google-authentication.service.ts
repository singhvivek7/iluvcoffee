import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticationService } from '../authentication.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oauthClient: OAuth2Client;
  constructor(
    private readonly configService: ConfigService,
    private readonly authenticationService: AuthenticationService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  onModuleInit() {
    const clientId = this.configService.getOrThrow('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow('GOOGLE_CLIENT_SECRET');
    this.oauthClient = new OAuth2Client(clientId, clientSecret);
  }

  async authenticate(token: string) {
    try {
      const loginTicket = await this.oauthClient.verifyIdToken({
        idToken: token,
      });

      const { email, sub: googleId } = loginTicket.getPayload();

      const user = await this.usersRepository.findOneBy({ googleId });

      if (user) {
        return this.authenticationService.generateTokens(user);
      } else {
        const newUser = this.usersRepository.create({
          email,
          googleId,
        });
        const savedUser = await this.usersRepository.save(newUser);

        return this.authenticationService.generateTokens(savedUser);
      }
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';

      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw new UnauthorizedException();
    }
  }
}
