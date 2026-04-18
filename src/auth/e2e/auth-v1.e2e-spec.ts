import * as request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';

import type { SigninResponseDto } from '../dto/signin-response.dto';
import { TestContainer } from '../../../test/e2e-test.container';
import type { Container } from '../../../test/types/container.type';
import type { SignupResponseDto } from '../dto/signup-response.dto';

describe('Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let server: App;
  let container: Container;

  beforeAll(async () => {
    container = await TestContainer.initialize();
    sequelize = container.getSequelize();
    app = container.getApp();
    server = container.getServer();
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

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
