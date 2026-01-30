import type { UserDto, UserPayloadDto } from '@app/shared/dtos';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { v4 as uuidv4 } from 'uuid';

import type { DeleteUserResponseDto } from '../src/admin/users/dto/delete-user-response.dto';
import type { GetAllUsersResponseDto } from '../src/admin/users/dto/get-all-users-response.dto';
import { AppModule } from '../src/app.module';
import type { SigninResponseDto } from '../src/auth/dto/signin-response.dto';
import type { SignupResponseDto } from '../src/auth/dto/signup-response.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let auth_token: string;
  let server: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    server = app.getHttpServer();
    sequelize = app.get<Sequelize>(Sequelize);

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
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('Authorization v1', () => {
    describe('Signup', () => {
      it('should signup as owner', async () => {
        const res = await request(server).post('/api/v1/auth/signup').send({
          fullname: 'Owner',
          email: 'owner@email.com',
          password: 'pass',
        });

        const body = res.body as SignupResponseDto;

        expect(res.status).toBe(201);
        expect(body.user).toHaveProperty('role', 'owner');
      });

      it('should signup as user with no access', async () => {
        const res = await request(server).post('/api/v1/auth/signup').send({
          fullname: 'Test',
          email: 'test@email.com',
          password: 'pass',
        });

        const body = res.body as SignupResponseDto;

        expect(res.status).toBe(201);
        expect(body.user).toHaveProperty('role', 'user');
        expect(body.user).toHaveProperty('hasAccess', false);
      });

      it('should throw on register with taken email', async () => {
        return await request(server)
          .post('/api/v1/auth/signup')
          .send({
            fullname: 'Test',
            email: 'test@email.com',
            password: 'pass',
          })
          .expect(403);
      });

      it('should throw if email is wrong format', async () => {
        return await request(server)
          .post('/api/v1/auth/signup')
          .send({
            fullname: 'Test',
            email: 'email',
            password: 'pass',
          })
          .expect(400);
      });

      it('should throw any dto field is missing', async () => {
        return await request(server)
          .post('/api/v1/auth/signup')
          .send({
            fullname: 'Test',
            email: 'email',
          })
          .expect(400);
      });
    });

    describe('Signin', () => {
      it('should signin as owner', async () => {
        const res = await request(server).post('/api/v1/auth/signin').send({
          email: 'owner@email.com',
          password: 'pass',
        });

        const body = res.body as SigninResponseDto;

        expect(body.message).toBe('Logged in successfully');
        expect(body.user).toHaveProperty('role', 'owner');
        expect(body.user).toHaveProperty('hasAccess', true);
        expect(body.auth_token).toBeDefined();
        expect(body.auth_token).not.toBeNull();

        auth_token = body.auth_token;
      });

      it('should signin as user', async () => {
        const res = await request(server).post('/api/v1/auth/signin').send({
          email: 'test@email.com',
          password: 'pass',
        });

        const body = res.body as SigninResponseDto;

        expect(body.message).toBe('Logged in successfully');
        expect(body.user).toHaveProperty('role', 'user');
        expect(body.user).toHaveProperty('hasAccess', false);
        expect(body.auth_token).toBeDefined();
        expect(body.auth_token).not.toBeNull();
      });

      it('should throw on missing fields', async () => {
        return await request(server)
          .post('/api/v1/auth/signin')
          .send({
            email: 'test@email.com',
          })
          .expect(401);
      });

      it('should throw on wrong pass or email', async () => {
        const res1 = await request(server)
          .post('/api/v1/auth/signin')
          .send({
            email: 'wrong@email.com',
            password: 'pass',
          })
          .expect(401);

        const res2 = await request(server)
          .post('/api/v1/auth/signin')
          .send({
            email: 'test@email.com',
            password: 'wrong',
          })
          .expect(401);

        expect(res1.status).toBe(401);
        expect(res2.status).toBe(401);
      });
    });
  });

  describe('Admin users v1', () => {
    it('should not pass user to admin endpoints', async () => {
      const token = (
        (
          await request(server).post('/api/v1/auth/signin').send({
            email: 'test@email.com',
            password: 'pass',
          })
        ).body as SigninResponseDto
      ).auth_token;

      return await request(server)
        .get('/api/v1/admin/users')
        .set({
          authorization: 'Bearer ' + token,
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
        email: 'test@email.com',
        password: '1234',
      });

      const body = signin.body as SigninResponseDto;

      expect(body.temporaryPasswordUsed).toBeTruthy();
    });
  });

  describe('Users v1', () => {
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
          oldPassword: 'pass',
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
});
