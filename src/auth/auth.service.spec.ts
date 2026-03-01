import type { UserPayloadDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';

import { FileModel } from '../database/models/file.model';
import { UserModel } from '../database/models/user.model';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { SharedFilesModel } from '../database/models/shared-files.model';

import { AuthService } from './auth.service';
import type { SignupBodyDto } from './dto/signup-body.dto';

describe('UsersService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          models: [UserModel, FileModel, SharedFilesModel],
          storage: ':memory:',
          autoLoadModels: true,
          sync: { force: true },
          logging: false,
        }),
        SequelizeModule.forFeature([UserModel, FileModel, SharedFilesModel]),
        JwtModule.register({
          secret: 'secret',
          signOptions: { expiresIn: '1m' },
        }),
      ],
      providers: [AuthService, UsersService, UsersRepository],
      exports: [SequelizeModule],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
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
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('signup', () => {
    it('should sign up an admin if none exists', async () => {
      const signupDto: SignupBodyDto = {
        fullname: 'Some name',
        email: 'admin@example.com',
        password: 'secure123',
      };

      const result = await authService.signup(signupDto);

      expect(result.auth_token).toBeDefined();
      expect(result.user.email).toBe(signupDto.email);
      expect(result.user.role).toBe(UserRoles.OWNER);
      expect(result.user.hasAccess).toBeTruthy();

      const users = await usersService.findAll();
      expect(users.length).toBe(1);
    });

    it('should create user without access if admin already exists', async () => {
      await usersService.createUser({
        fullname: 'Some name',
        email: 'admin@exists.com',
        password: '123456',
        role: UserRoles.ADMIN,
        hasAccess: true,
      });

      const dto: SignupBodyDto = {
        fullname: 'Some name',
        email: 'newadmin@example.com',
        password: 'newpass',
      };

      const { user } = await authService.signup(dto);

      expect(user.role).toBe(UserRoles.USER);
      expect(user.hasAccess).toBeFalsy();
    });
  });

  describe('signin', () => {
    it('should return JWT token and user payload', async () => {
      const user = await usersService.createUser({
        fullname: 'Some name',
        email: 'signin@test.com',
        password: '123456',
        role: UserRoles.ADMIN,
      });

      const payload: UserPayloadDto = {
        fullname: user.fullname,
        userId: user.userId,
        email: user.email,
        role: user.role,
        hasAccess: user.hasAccess,
      };

      const result = await authService.signin(payload);

      expect(result.auth_token).toBeDefined();
      expect(result.user.email).toBe(payload.email);
    });
  });

  describe('validateUser', () => {
    it('should return user dto when credentials are valid', async () => {
      const plainPw = 'validpassword';
      const user = await usersService.createUser({
        fullname: 'Some name',
        email: 'valid@user.com',
        password: plainPw,
        role: UserRoles.ADMIN,
        hasAccess: true,
      });

      const result = await authService.validateUser(user.email, plainPw);

      expect(result.email).toBe(user.email);
      expect(result.role).toBe(UserRoles.ADMIN);
    });

    it('should throw if email does not exist', async () => {
      await expect(
        authService.validateUser('not@found.com', 'any'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password is incorrect', async () => {
      await usersService.createUser({
        fullname: 'Some name',
        email: 'wrongpw@user.com',
        password: 'rightpass',
        role: UserRoles.ADMIN,
      });

      await expect(
        authService.validateUser('wrongpw@user.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
