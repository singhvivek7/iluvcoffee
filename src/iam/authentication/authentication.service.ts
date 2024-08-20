import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { TokenResponseDto, SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  InvalidateRefreshTokenError,
  RefreshTokenIdsStorage,
} from './refresh-token-ids.storage';
import { randomUUID } from 'crypto';
import { OtpAuthenticationService } from './otp-authentication.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly otpAuthenticationService: OtpAuthenticationService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<void> {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);

      await this.usersRepository.save(user);
    } catch (error) {
      const pgUniqueViolationErrorCode = '23505';

      if (error.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }

      throw error;
    }
  }

  async signIn(signInDto: SignInDto): Promise<TokenResponseDto> {
    const user = await this.usersRepository.findOneBy({
      email: signInDto.email,
    });

    if (!user) {
      throw new UnauthorizedException("Email or password doesn't match");
    }

    const isPasswordValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Email or password doesn't match");
    }

    if (user.isTfaEnabled) {
      const isCodeValid = this.otpAuthenticationService.verifyCode(
        signInDto.tfaCode,
        user.tfaSecret,
      );

      if (!isCodeValid) {
        throw new UnauthorizedException('Invalid TFA code');
      }
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
          // ⚠️ WARNING: not ideal
          permissions: user.permissions,
        },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);

    return { accessToken, refreshToken };
  }

  async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn,
      },
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.usersRepository.findOneByOrFail({ id: sub });

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidateRefreshTokenError) {
        // Take action: notify user that his refresh token is no stolen
        throw new UnauthorizedException('Access denied');
      }
      throw new UnauthorizedException();
    }
  }
}
