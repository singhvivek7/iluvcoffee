import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { SessionAuthenticationService } from './session-authentication.service';
import { SignInDto } from './dto/sign-in.dto';
import { promisify } from 'util';
import { Request } from 'express';
import { SessionGuard } from './guards/session.guard';
import { ActiveUser } from '../decorators/active-user.decorator';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

@Auth(AuthType.None)
@Controller('session-authentication')
export class SessionAuthenticationController {
  constructor(
    private readonly sessionAuthenticationService: SessionAuthenticationService,
  ) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Req() req: Request, @Body() signInDto: SignInDto) {
    const user = await this.sessionAuthenticationService.signIn(signInDto);
    await promisify(req.logIn).call(req, user); // 👈 new line
  }

  @UseGuards(SessionGuard)
  @Get()
  getHello(@ActiveUser() user: ActiveUserData) {
    return `Hello, ${user.email}!`;
  }
}
