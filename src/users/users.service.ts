import { toUserDto } from '@app/shared/builders';
import { UserDto, UserPayloadDto } from '@app/shared/dtos';
import { generateHash } from '@app/shared/utils';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { useInnerError } from '@app/shared/helpers';

import { UserModel } from '../database/models/user.model';

import { ChangeUserInfoBodyDto } from './dto/change-user-info-body.dto';
import { ChangeUserPasswordBodyDto } from './dto/change-user-password-body.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  protected readonly logger = new Logger(UsersService.name);

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

  public async getProfile(userId: string): Promise<UserPayloadDto> {
    const user = await this.usersRepository.findByPk(userId);

    if (!user) {
      this.logger.error(useInnerError('LUNF'));
      throw new InternalServerErrorException(
        'Logged in user profile not found',
      );
    }

    return toUserDto(user);
  }
}
