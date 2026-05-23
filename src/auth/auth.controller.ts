import { User } from '@app/shared/decorators';
import { RejectResponseDto, UserPayloadDto } from '@app/shared/dtos';
import { LocalGuard } from '@app/shared/guards';
import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SigninBodyDto } from './dto/signin-body.dto';
import { SigninResponseDto } from './dto/signin-response.dto';
import { SignupBodyDto } from './dto/signup-body.dto';
import { SignupResponseDto } from './dto/signup-response.dto';

@ApiTags('Authorization')
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  type: RejectResponseDto,
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register as user or owner' })
  @ApiResponse({ status: HttpStatus.OK, type: SignupResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: RejectResponseDto })
  public async signup(
    @Body() signupDto: SignupBodyDto,
  ): Promise<SignupResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @UseGuards(LocalGuard)
  @ApiBody({
    type: SigninBodyDto,
  })
  @ApiOperation({ summary: 'Log into as user or administrator' })
  @ApiResponse({ status: HttpStatus.OK, type: SigninResponseDto })
  public async signin(
    @User() userDto: UserPayloadDto,
  ): Promise<SigninResponseDto> {
    return this.authService.signin(userDto);
  }
}
