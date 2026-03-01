import { afterEach } from 'node:test';

import type { UserDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';
import { ForbiddenException } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';

import { FileModel } from '../database/models/file.model';
import { UserModel } from '../database/models/user.model';

import type { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          models: [UserModel, FileModel],
          storage: ':memory:',
          autoLoadModels: true,
          sync: { force: true },
          logging: false,
        }),
        SequelizeModule.forFeature([UserModel, FileModel]),
      ],
      providers: [UsersService, UsersRepository],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterEach(async () => {
    await UserModel.truncate();
  });

  afterAll(async () => {
    await sequelize.drop();
    await sequelize.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should create user', async () => {
    const dto: CreateUserDto = {
      email: 'test@email.com',
      fullname: 'name',
      password: 'password',
    };

    const createdUser = await service.createUser(dto);
    const userInDb = await repository.findByPk(createdUser.userId);

    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(dto.email);
    expect(createdUser.fullname).toBe(dto.fullname);
    expect(createdUser.role).toBe(UserRoles.USER);

    expect(userInDb?.password).not.toBe(dto.password);
  });

  it('Should find all users', async () => {
    const dto: CreateUserDto = {
      email: 'admin@email.com',
      fullname: 'name',
      password: 'password',
      role: UserRoles.ADMIN,
    };

    const createdUser = await service.createUser(dto);
    const [, admin] = await service.findAll();

    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(dto.email);
    expect(createdUser.fullname).toBe(dto.fullname);
    expect(createdUser.role).toBe(UserRoles.ADMIN);

    expect(admin).toBeDefined();
    expect(admin.email).toBe(dto.email);
    expect(admin.fullname).toBe(dto.fullname);
    expect(admin.role).toBe(UserRoles.ADMIN);
  });

  it('Should find user by email', async () => {
    const dto: CreateUserDto = {
      email: 'test@email.com',
      fullname: 'name',
      password: 'password',
    };

    const user = await service.getUserByEmail('test@email.com');

    expect(user).toBeDefined();
    expect(user?.email).toBe(dto.email);
    expect(user?.fullname).toBe(dto.fullname);
    expect(user?.role).toBe(UserRoles.USER);
    expect(user?.password).not.toBe(dto.password);
  });

  it('should change user info', async () => {
    const dto: CreateUserDto = {
      email: 'test1@email.com',
      fullname: 'name',
      password: 'password',
    };

    const createdUser = await service.createUser(dto);

    const updatedUser = await service.changeUserInfo(createdUser.userId, {
      email: 'updated@email.com',
    });

    expect(updatedUser.email).not.toBe(createdUser.email);
    expect(updatedUser.fullname).toBe(createdUser.fullname);
  });

  describe('update user password', () => {
    const dto: CreateUserDto = {
      email: 'test2@email.com',
      fullname: 'name',
      password: 'password',
    };

    let createdUser: UserDto;

    beforeAll(async () => {
      createdUser = await service.createUser(dto);
      createdUser = (await repository.updateByPk(createdUser.userId, {
        mustChangePassword: true,
      })) as UserModel;
    });

    afterAll(async () => {
      await UserModel.truncate();
    });

    it('should throw on different passwords with original', async () => {
      await expect(
        service.changePassword(createdUser.userId, {
          newPassword: 'somepass',
          oldPassword: 'wrongpass',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update password', async () => {
      await service.changePassword(createdUser.userId, {
        newPassword: 'newpass',
        oldPassword: 'password',
      });

      const updatedUser = await service.getUserByEmail('test2@email.com');

      const pwMatch = await bcrypt.compare('newpass', updatedUser!.password);

      expect(pwMatch).toBeTruthy();

      await expect(
        bcrypt.compare('newpass', updatedUser!.password),
      ).resolves.toBeTruthy();

      expect(updatedUser?.mustChangePassword).toBeFalsy();
    });
  });
});
