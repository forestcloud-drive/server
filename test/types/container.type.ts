import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';

export interface Container {
  app: INestApplication<App>;
  sequelize: Sequelize;
  server: App;
}
