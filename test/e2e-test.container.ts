import * as fs from 'fs/promises';

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

class TestContainerClass implements Container {
  private _app?: INestApplication<App>;
  private _sequelize?: Sequelize;
  private _server?: App;

  constructor() {}

  public async initialize(): Promise<Container> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this._app = moduleFixture.createNestApplication<INestApplication<App>>();

    this._server = this._app.getHttpServer();
    this._sequelize = this._app.get<Sequelize>(Sequelize);

    this._app.setGlobalPrefix('api');
    this._app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
    });
    this._app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
        transformOptions: {
          exposeUnsetFields: false,
        },
        forbidNonWhitelisted: true,
      }),
    );

    await this._app.init();

    return this;
  }

  public getApp(): INestApplication<App> {
    if (!this._app) {
      throw new Error('TestContainer not initialized. Call initialize() first');
    }

    return this._app;
  }

  public getSequelize(): Sequelize {
    if (!this._sequelize) {
      throw new Error('TestContainer not initialized. Call initialize() first');
    }

    return this._sequelize;
  }

  public getServer(): App {
    if (!this._server) {
      throw new Error('TestContainer not initialized. Call initialize() first');
    }

    return this._server;
  }

  public async authenticateUser(
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

  public async cleanUploads(): Promise<void> {
    const config = this._app?.get(ConfigService);
    const uploadsPath = config?.get<string>(EnvParams.UPLOADS_DEST);

    if (!uploadsPath) {
      throw new Error('Cannot get uploads path');
    }

    try {
      await fs.rm(uploadsPath, { recursive: true, force: true });
      await fs.mkdir(uploadsPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to clean uploads directory: `, error);
      process.exit(1);
    }
  }
}

export const TestContainer = new TestContainerClass();
