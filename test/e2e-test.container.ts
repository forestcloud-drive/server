import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'supertest/types';
import type { UserRoles } from '@app/shared/enums';
import { EnvParams } from '@app/shared/enums';
import { getModelToken } from '@nestjs/sequelize';
import { generateHash } from '@app/shared/utils';
import { JwtService } from '@nestjs/jwt';

import { UserModel } from '../src/database/models/user.model';
import type { CreateUserDto } from '../src/users/dto/create-user.dto';
import { AppModule } from '../src/app.module';
import type { SignupResponseDto } from '../src/auth/dto/signup-response.dto';

import type { Container } from './types/container.type';

export class TestContainer {
  private static _app: INestApplication<App> | null = null;

  public static async initApp(): Promise<Container> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication<INestApplication<App>>();
    const server: App = app.getHttpServer();
    const sequelize = app.get<Sequelize>(Sequelize);

    this._app = app;

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
        transformOptions: {
          exposeUnsetFields: false,
        },
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    return { app, server, sequelize };
  }

  public static async authenticateUser(
    role: UserRoles,
    hasAccess: boolean = true,
  ): Promise<SignupResponseDto> {
    const createUserDto: CreateUserDto = {
      fullname: role.charAt(0).toUpperCase() + role.slice(1),
      role,
      hasAccess,
      email: `${role}@email.com`,
      password: 'password',
    };

    const userModel = this._app?.get<typeof UserModel>(
      getModelToken(UserModel),
    );

    if (!userModel) {
      throw new Error('Cant get UserModel');
    }

    const passwordHash = await generateHash(createUserDto.password);

    const createdUser = await userModel.create({
      ...createUserDto,
      password: passwordHash,
    });

    const config = this._app?.get(ConfigService);
    const jwtSecret = config?.get<string>(EnvParams.JWT_SECRET);

    const jwtService = new JwtService({
      secret: jwtSecret,
      signOptions: {
        expiresIn: '1h',
      },
    });
    const authToken = await jwtService.signAsync({ ...createdUser.toJSON() });

    return { auth_token: authToken, user: createdUser };
  }
}
