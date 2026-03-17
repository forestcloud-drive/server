import * as request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';
import type { UserPayloadDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';

import type { Container } from '../../../test/types/container.type';
import { TestContainer } from '../../../test/e2e-test.container';

describe('Users v1', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let auth_token: string;
  let server: App;
  let container: Container;

  beforeAll(async () => {
    container = await TestContainer.initApp();
    sequelize = container.sequelize;
    app = container.app;
    server = container.server;

    ({ auth_token } = await TestContainer.authenticateUser(UserRoles.OWNER));
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should get currently logged in user profile', async () => {
    const res = await request(server)
      .get('/api/v1/users/profile')
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as UserPayloadDto;

    expect(body.email).toBe('owner@email.com');
    expect(body.fullname).toBe('Owner');
  });

  it('should change currently logged in user info', async () => {
    const res = await request(server)
      .put('/api/v1/users/profile')
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({});

    const body = res.body as UserPayloadDto;

    expect(body.fullname).toBe('Owner');
  });

  it('should change users password', async () => {
    return await request(server)
      .put('/api/v1/users/password')
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        oldPassword: 'password',
        newPassword: 'newpass',
      })
      .expect(200);
  });

  it('should throw if old pass is wrong', async () => {
    return await request(server)
      .put('/api/v1/users/password')
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        oldPassword: 'wrong',
        newPassword: 'newpass',
      })
      .expect(403);
  });
});
