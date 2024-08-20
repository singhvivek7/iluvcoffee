import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { ApiTags } from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ActiveUser } from '../decorators/active-user.decorator';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { Response } from 'express';
import { OtpAuthenticationService } from './otp-authentication.service';
import { toFileStream } from 'qrcode';
import { SignInDto } from './dto/sign-in.dto';

@ApiTags('Authentication')
@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly otpAuthenticationService: OtpAuthenticationService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
    // @Res({ passthrough: true }) res: Response,
  ) {
    return this.authenticationService.signIn(signInDto);
    // res.cookie('accessToken', accessToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: true,
    // });
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authenticationService.refreshToken(refreshTokenDto);
  }

  @Auth(AuthType.Bearer)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  async generateQrCode(
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
  ) {
    const { secret, uri } = await this.otpAuthenticationService.generateSecret(
      activeUser.email,
    );

    await this.otpAuthenticationService.enableTfaForUser(
      activeUser.email,
      secret,
    );

    res.type('png');
    return toFileStream(res, uri);
  }
}
