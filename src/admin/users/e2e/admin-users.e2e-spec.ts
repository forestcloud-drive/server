import * as request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import type { UserDto } from '@app/shared/dtos';
import { UserRoles } from '@app/shared/enums';

import type { Container } from '../../../../test/types/container.type';
import { TestContainer } from '../../../../test/e2e-test.container';
import type { SigninResponseDto } from '../../../auth/dto/signin-response.dto';
import type { GetAllUsersResponseDto } from '../dto/get-all-users-response.dto';
import type { DeleteUserResponseDto } from '../dto/delete-user-response.dto';

describe('Admin users v1', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let auth_token: string;
  let server: App;
  let container: Container;

  beforeAll(async () => {
    container = await TestContainer.initialize();
    sequelize = container.getSequelize();
    app = container.getApp();
    server = container.getServer();

    ({ auth_token } = await TestContainer.authenticateUser(UserRoles.OWNER));
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should not pass user to admin endpoints', async () => {
    const { auth_token } = await TestContainer.authenticateUser(
      UserRoles.USER,
      false,
    );

    return await request(server)
      .get('/api/v1/admin/users')
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .expect(403);
  });

  it('should not pass unauthorized users', async () => {
    return await request(server).get('/api/v1/admin/users').expect(401);
  });

  it('should get all users', async () => {
    const res = await request(server)
      .get('/api/v1/admin/users')
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as GetAllUsersResponseDto;

    expect(body.users).toHaveLength(2);
    expect(body.users[0].role).toBe('owner');
    expect(body.users[1].role).toBe('user');
  });

  it('should add new user', async () => {
    const res = await request(server)
      .post('/api/v1/admin/users')
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        fullname: 'Added User',
        email: 'added@email.com',
        password: 'somepass',
        role: 'admin',
      });

    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const body = res.body as UserDto;

    expect(body.hasAccess).toBeTruthy();
    expect(body.role).toBe('admin');
    expect(getAll.users).toHaveLength(3);
  });

  it('should get user by id', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const res = await request(server)
      .get(`/api/v1/admin/users/${getAll.users[2].userId}`)
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as UserDto;

    expect(body.email).toBe('added@email.com');
  });

  it('should throw on wrong userId param', async () => {
    return await request(server)
      .get(`/api/v1/admin/users/some`)
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .expect(400);
  });

  it('should throw on wrong userId', async () => {
    return await request(server)
      .get(`/api/v1/admin/users/${uuidv4()}`)
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .expect(404);
  });

  it('should change user info', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const res = await request(server)
      .put(`/api/v1/admin/users/${getAll.users[2].userId}`)
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        email: 'admin@email.com',
      });

    const body = res.body as UserDto;

    expect(body.email).toBe('admin@email.com');
  });

  it('should restrict admins to change admins or owners info', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const signin = (
      await request(server).post('/api/v1/auth/signin').send({
        email: 'admin@email.com',
        password: 'somepass',
      })
    ).body as SigninResponseDto;

    expect(signin.temporaryPasswordUsed).toBeTruthy();
    expect(signin.message).toBe(
      'Temporary password used. Please change your password',
    );

    return await request(server)
      .put(`/api/v1/admin/users/${getAll.users[0].userId}`)
      .set({
        authorization: 'Bearer ' + signin.auth_token,
      })
      .send({
        email: 'admin@email.com',
      })
      .expect(403);
  });

  it('should delete user', async () => {
    await request(server).post('/api/v1/auth/signup').send({
      fullname: 'Delete',
      email: 'delete@email.com',
      password: 'pass',
    });

    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    expect(getAll.users).toHaveLength(4);

    const res = await request(server)
      .delete('/api/v1/admin/users/' + getAll.users[3].userId)
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as DeleteUserResponseDto;

    expect(body.userId).toBe(getAll.users[3].userId);
    expect(new Date(body.deletedAt).getTime()).toBeLessThan(Date.now() + 1);

    const getAllAfterDelete = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    expect(getAllAfterDelete.users).toHaveLength(3);
  });

  it('should give user access', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const user = getAll.users[1];

    expect(user.hasAccess).toBeFalsy();

    const res = await request(server)
      .put(`/api/v1/admin/users/${user.userId}/give-access`)
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as UserDto;

    expect(body.hasAccess).toBeTruthy();
  });

  it('should restrict access to user', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const user = getAll.users[1];

    expect(user.hasAccess).toBeTruthy();

    const res = await request(server)
      .put(`/api/v1/admin/users/${user.userId}/restrict-access`)
      .set({
        authorization: 'Bearer ' + auth_token,
      });

    const body = res.body as UserDto;

    expect(body.hasAccess).toBeFalsy();
  });

  it('should change user role', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const user = getAll.users[1];

    expect(user.role).toBe('user');

    const res = await request(server)
      .put(`/api/v1/admin/users/${user.userId}/role`)
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        role: 'admin',
      });

    const body = res.body as UserDto;

    expect(body.role).toBe('admin');
  });

  it('should change user password', async () => {
    const getAll = (
      await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + auth_token,
        })
    ).body as GetAllUsersResponseDto;

    const user = getAll.users[1];

    await request(server)
      .put(`/api/v1/admin/users/${user.userId}/password`)
      .set({
        authorization: 'Bearer ' + auth_token,
      })
      .send({
        newPassword: '1234',
      })
      .expect(200);

    const signin = await request(server).post('/api/v1/auth/signin').send({
      email: user.email,
      password: '1234',
    });

    const body = signin.body as SigninResponseDto;

    expect(body.temporaryPasswordUsed).toBeTruthy();
  });
});
