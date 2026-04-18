import { toUserDto } from '@app/shared/builders';
import { UserDto } from '@app/shared/dtos';
import { generateHash } from '@app/shared/utils';
import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserModel } from '../database/models/user.model';

import { ChangeUserInfoBodyDto } from './dto/change-user-info-body.dto';
import { ChangeUserPasswordBodyDto } from './dto/change-user-password-body.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const passwordHash = await generateHash(createUserDto.password);

    const createdUser = await this.usersRepository.create({
      ...createUserDto,
      password: passwordHash,
    });

    return toUserDto(createdUser);
  }

  public async findAll(): Promise<UserDto[]> {
    const users = await this.usersRepository.findAll({});

    return users.map((user) => toUserDto(user));
  }

  public async getUserByEmail(email: string): Promise<UserModel | null> {
    return await this.usersRepository.findOne({
      email,
    });
  }

  public async changeUserInfo(
    userId: string,
    updateDto: ChangeUserInfoBodyDto,
  ): Promise<UserDto> {
    const updatedUser = await this.usersRepository.updateByPk(
      userId,
      updateDto,
    );

    return toUserDto(updatedUser!);
  }

  public async changePassword(
    userId: string,
    changeUserPasswordDto: ChangeUserPasswordBodyDto,
  ): Promise<UserDto> {
    const { oldPassword, newPassword } = changeUserPasswordDto;
    const user = await this.usersRepository.findByPk(userId);

    const pwMatch = await bcrypt.compare(oldPassword, user!.password);

    if (!pwMatch) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const newPasswordHash = await generateHash(newPassword);

    const updatedUser = await this.usersRepository.updateByPk(userId, {
      password: newPasswordHash,
      mustChangePassword: false,
    });

    return toUserDto(updatedUser!);
  }
}
