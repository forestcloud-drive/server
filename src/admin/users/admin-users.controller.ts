import { Roles } from '@app/shared/decorators';
import { RejectResponseDto, UserDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';
import {
  JwtGuard,
  OperateOnUserPermissionGuard,
  RoleGuard,
} from '@app/shared/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ChangeUserInfoBodyDto } from '../../users/dto/change-user-info-body.dto';

import { AdminUsersService } from './admin-users.service';
import { AddNewUserBodyDto } from './dto/add-new-user-body.dto';
import { ChangeUserRoleBody } from './dto/change-user-role-body';
import { DeleteUserResponseDto } from './dto/delete-user-response.dto';
import { GetAllUsersResponseDto } from './dto/get-all-users-response.dto';
import { GetUserByIdParamsDto } from './dto/get-user-by-id-params.dto';
import { ResetUserPasswordBodyDto } from './dto/reset-user-password-body.dto';

@ApiTags('Admin users')
@ApiResponse({
  status: 403,
  type: RejectResponseDto,
})
@ApiResponse({
  status: 401,
  type: RejectResponseDto,
})
@ApiBearerAuth()
@Roles([UserRoles.ADMIN])
@UseGuards(JwtGuard, RoleGuard)
@Controller({ path: 'admin/users', version: '1' })
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    type: GetAllUsersResponseDto,
  })
  public async getUsers(): Promise<GetAllUsersResponseDto> {
    return this.usersService.getUsers();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async getUserById(
    @Param() { userId }: GetUserByIdParamsDto,
  ): Promise<UserDto> {
    return this.usersService.getUserById(userId);
  }

  @Put(':userId/give-access')
  @ApiOperation({ summary: 'Give user access' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async giveUserAccess(
    @Param() { userId }: GetUserByIdParamsDto,
  ): Promise<UserDto> {
    return this.usersService.giveUserAccess(userId);
  }

  @Put(':userId/restrict-access')
  @UseGuards(OperateOnUserPermissionGuard)
  @ApiOperation({ summary: 'Restrict access to user' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async restrictUserAccess(
    @Param() { userId }: GetUserByIdParamsDto,
  ): Promise<UserDto> {
    return this.usersService.restrictUserAccess(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add new user' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  public async addNewUser(
    @Body() newUserDto: AddNewUserBodyDto,
  ): Promise<UserDto> {
    return this.usersService.addNewUser(newUserDto);
  }

  @Put(':userId')
  @UseGuards(OperateOnUserPermissionGuard)
  @ApiOperation({ summary: 'Change user info' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async changeUserInfo(
    @Param() { userId }: GetUserByIdParamsDto,
    @Body() bodyDto: ChangeUserInfoBodyDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserInfo(userId, bodyDto);
  }

  @Put(':userId/role')
  @Roles([UserRoles.OWNER])
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async changeUserRole(
    @Param() { userId }: GetUserByIdParamsDto,
    @Body() { role }: ChangeUserRoleBody,
  ): Promise<UserDto> {
    return this.usersService.changeUserRole(userId, role);
  }

  @Put(':userId/password')
  @UseGuards(OperateOnUserPermissionGuard)
  @ApiOperation({ summary: 'Recover user password' })
  @ApiResponse({
    status: 200,
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: RejectResponseDto,
  })
  public async changeUserPassword(
    @Param() { userId }: GetUserByIdParamsDto,
    @Body() { newPassword }: ResetUserPasswordBodyDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserPassword(userId, newPassword);
  }

  @Delete(':userId')
  @UseGuards(OperateOnUserPermissionGuard)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    type: DeleteUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 404,
    type: DeleteUserResponseDto,
  })
  public async deleteUser(
    @Param() { userId }: GetUserByIdParamsDto,
  ): Promise<DeleteUserResponseDto> {
    return this.usersService.deleteUser(userId);
  }
}
