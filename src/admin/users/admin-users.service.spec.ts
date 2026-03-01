import { UserRoles } from '@app/shared/enums';
import { NotFoundException } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';

import { FileModel } from '../../database/models/file.model';
import { UserModel } from '../../database/models/user.model';

import { AdminUserRepository } from './admin-user.repository';
import { AdminUsersService } from './admin-users.service';

describe('UsersService', () => {
  let service: AdminUsersService;
  let repository: AdminUserRepository;
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
        }),
        SequelizeModule.forFeature([UserModel, FileModel]),
      ],
      providers: [AdminUsersService, AdminUserRepository],
      exports: [SequelizeModule],
    }).compile();

    repository = module.get<AdminUserRepository>(AdminUserRepository);
    service = module.get<AdminUsersService>(AdminUsersService);
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterAll(async () => {
    await sequelize.drop();
    await sequelize.close();
  });

  afterEach(async () => {
    await UserModel.truncate();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('give access', () => {
    it('should give access to user', async () => {
      const noAccessUser = await repository.create({
        fullname: 'Some name',
        email: 'some@exists.com',
        password: '123456',
        role: UserRoles.USER,
        hasAccess: false,
      });

      const updatedUser = await service.giveUserAccess(noAccessUser.userId);

      expect(updatedUser.hasAccess).toBeTruthy();
    });

    it('should throw if user do not exists', async () => {
      await expect(service.giveUserAccess('someid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
