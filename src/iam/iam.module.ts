import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as expressSession from 'express-session';
import * as passport from 'passport';
import * as createRedisStore from 'connect-redis';

import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { User } from 'src/users/entities/user.entity';
import jwtConfig from './config/jwt.config';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage';
import { RolesGuard } from './authorization/guards/roles.guard';
import { PermissionGuard } from './authorization/guards/permission.guard';
import { ApiKeysService } from './authentication/api-keys.service';
import { ApiKey } from 'src/users/api-keys/entities/api-key.entity';
import { ApiKeyGuard } from './authentication/guards/api-key.guard';
import { OtpAuthenticationService } from './authentication/otp-authentication.service';
import { GoogleAuthenticationService } from './authentication/social/google-authentication.service';
import { GoogleAuthenticationController } from './authentication/social/google-authentication.controller';
import { SessionAuthenticationService } from './authentication/session-authentication.service';
import { SessionAuthenticationController } from './authentication/session-authentication.controller';
import { UserSerializer } from './authentication/serializers/user-serializer';
import { Redis } from 'ioredis';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApiKey]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    AccessTokenGuard,
    ApiKeyGuard,
    AuthenticationService,
    RefreshTokenIdsStorage,
    ApiKeysService,
    OtpAuthenticationService,
    GoogleAuthenticationService,
    SessionAuthenticationService,
    UserSerializer,
  ],
  controllers: [
    AuthenticationController,
    GoogleAuthenticationController,
    SessionAuthenticationController,
  ],
})
export class IamModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const RedisStore = createRedisStore(expressSession);
    const redisStoreOptions: createRedisStore.RedisStoreOptions = {
      client: new Redis(6379, 'localhost'),
    };
    consumer
      .apply(
        expressSession({
          store: new RedisStore(redisStoreOptions),
          secret: process.env.SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            // secure: true,
            sameSite: true,
          },
        }),
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
