import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';

import type { Container } from './types/container.type';

export class TestContainer {
  public static async initApp(): Promise<Container> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication<INestApplication<App>>();
    const server: App = app.getHttpServer();
    const sequelize = app.get<Sequelize>(Sequelize);

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

    return { app, server, sequelize };
  }
}
