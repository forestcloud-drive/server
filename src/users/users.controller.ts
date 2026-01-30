import { User } from '@app/shared/decorators';
import { RejectResponseDto, UserDto, UserPayloadDto } from '@app/shared/dtos';
import { JwtGuard } from '@app/shared/guards';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ChangeUserInfoBodyDto } from './dto/change-user-info-body.dto';
import { ChangeUserPasswordBodyDto } from './dto/change-user-password-body.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  type: RejectResponseDto,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  type: RejectResponseDto,
})
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current logged in user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserPayloadDto,
  })
  public async getCurrentLoggedUser(
    @User() userDto: UserPayloadDto,
  ): Promise<UserPayloadDto> {
    return Promise.resolve(userDto);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Change users fullname or email' })
  @ApiResponse({
    status: 200,
    type: UserPayloadDto,
  })
  public async changeUserInfo(
    @User('userId') userId: string,
    @Body() updateDto: ChangeUserInfoBodyDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserInfo(userId, updateDto);
  }

  @Put('password')
  @ApiOperation({ summary: 'Change users password' })
  @ApiResponse({
    status: 200,
    type: UserPayloadDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  public async changeUserPassword(
    @User('userId') userId: string,
    @Body() changePasswordDto: ChangeUserPasswordBodyDto,
  ): Promise<UserDto> {
    return this.usersService.changePassword(userId, changePasswordDto);
  }
}
