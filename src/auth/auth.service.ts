import { toUserDto } from '@app/shared/builders';
import { UserDto, UserPayloadDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { SigninResponseDto } from './dto/signin-response.dto';
import { SignupBodyDto } from './dto/signup-body.dto';
import { SignupResponseDto } from './dto/signup-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public async signup(signupDto: SignupBodyDto): Promise<SignupResponseDto> {
    const users = await this.usersService.findAll();

    const createUserDto: CreateUserDto = {
      ...signupDto,
    };

    if (users.find((user) => user.email === signupDto.email)) {
      throw new ForbiddenException('Please, try other email');
    }

    if (!users.length) {
      createUserDto.role = UserRoles.OWNER;
      createUserDto.hasAccess = true;
    }

    const createdUser = await this.usersService.createUser({
      ...createUserDto,
    });

    const authToken = await this.jwtService.signAsync({ ...createdUser });

    return { auth_token: authToken, user: createdUser };
  }

  public async signin(userDto: UserPayloadDto): Promise<SigninResponseDto> {
    let message = 'Logged in successfully';

    const authToken = await this.jwtService.signAsync({ ...userDto });
    const user = await this.usersService.getUserByEmail(userDto.email);

    if (user?.mustChangePassword) {
      message = 'Temporary password used. Please change your password';
    }

    return {
      auth_token: authToken,
      user: userDto,
      message,
      temporaryPasswordUsed: user?.mustChangePassword,
    };
  }

  public async validateUser(email: string, password: string): Promise<UserDto> {
    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credentials are incorrect');
    }

    const pwMatch = await bcrypt.compare(password, user.password);

    if (!pwMatch) {
      throw new UnauthorizedException('Credentials are incorrect');
    }

    return toUserDto(user);
  }
}
