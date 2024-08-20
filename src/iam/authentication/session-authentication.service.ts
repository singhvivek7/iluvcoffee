import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from '../hashing/hashing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class SessionAuthenticationService {
  constructor(
    private readonly hashingService: HashingService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async signIn(signInDto: SignInDto) {
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

    return user;
  }
}
