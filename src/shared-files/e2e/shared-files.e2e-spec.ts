import { describe } from 'node:test';

import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';

import { TestContainer } from '../../../test/e2e-test.container';
import type { Container } from '../../../test/types/container.type';

describe('SharedFiles (e2e)', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let auth_token: string;
  let server: App;
  let container: Container;

  beforeAll(async () => {
    container = await TestContainer.initApp();
    sequelize = container.sequelize;
    app = container.app;
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });
});
