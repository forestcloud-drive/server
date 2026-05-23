import { toUserDto } from '@app/shared/builders';
import { UserDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';
import { generateHash } from '@app/shared/utils';
import { Injectable, NotFoundException } from '@nestjs/common';

import { ChangeUserInfoBodyDto } from '../../users/dto/change-user-info-body.dto';

import { AdminUserRepository } from './admin-user.repository';
import { AddNewUserBodyDto } from './dto/add-new-user-body.dto';
import { DeleteUserResponseDto } from './dto/delete-user-response.dto';
import { GetAllUsersResponseDto } from './dto/get-all-users-response.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersRepository: AdminUserRepository) {}

  public async giveUserAccess(userId: string): Promise<UserDto> {
    const updatedUser = await this.usersRepository.giveAccess(userId);

    return toUserDto(updatedUser);
  }

  public async restrictUserAccess(userId: string): Promise<UserDto> {
    const updatedUser = await this.usersRepository.restrictAccess(userId);

    return toUserDto(updatedUser);
  }

  public async addNewUser(newUserDto: AddNewUserBodyDto): Promise<UserDto> {
    const {
      fullname,
      email,
      password,
      role,
      hasAccess = true,
      mustChangePassword = true,
    } = newUserDto;

    const hashedPassword = await generateHash(password);

    const newUser = await this.usersRepository.create({
      fullname,
      email,
      password: hashedPassword,
      role,
      hasAccess,
      mustChangePassword,
    });

    return toUserDto(newUser);
  }

  public async changeUserInfo(
    userId: string,
    bodyDto: ChangeUserInfoBodyDto,
  ): Promise<UserDto> {
    const changedUser = await this.usersRepository.updateByPk(userId, bodyDto);

    if (!changedUser) {
      throw new NotFoundException(`User not found by '${userId}' id`);
    }

    return toUserDto(changedUser);
  }

  public async changeUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<UserDto> {
    const newPasswordHash = await generateHash(newPassword);

    const updatedUser = await this.usersRepository.updateByPk(userId, {
      password: newPasswordHash,
      mustChangePassword: true,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User not found by '${userId}' id`);
    }

    return toUserDto(updatedUser);
  }

  public async deleteUser(userId: string): Promise<DeleteUserResponseDto> {
    const deleteUser = await this.usersRepository.deleteUser(userId);

    return { userId: deleteUser.userId, deletedAt: deleteUser.deletedAt! };
  }

  public async changeUserRole(
    userId: string,
    role: UserRoles,
  ): Promise<UserDto> {
    const updatedUser = await this.usersRepository.changeRole(userId, role);

    return toUserDto(updatedUser);
  }

  public async getUsers(): Promise<GetAllUsersResponseDto> {
    const users = await this.usersRepository.findAll({});

    const mappedUsers = users.map((user) => toUserDto(user));

    return { users: mappedUsers };
  }

  public async getUserById(userId: string): Promise<UserDto> {
    const user = await this.usersRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`User not found by '${userId}' id`);
    }

    return toUserDto(user);
  }
}
