import * as request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';
import { UserRoles } from '@app/shared/enums';
import type { FileDto, SharedFileDto } from '@app/shared/dtos';
import { getShareId } from '@app/shared/utils';

import { TestContainer } from '../../../test/e2e-test.container';
import type { Container } from '../../../test/types/container.type';
import type { GetFilesResponseDto } from '../../directories/dto/get-files-response.dto';
import type { UploadFilesResponseDto } from '../../files/dto/upload-files-response.dto';
import type { ShareLinkResponseDto } from '../dto/share-link-response.dto';

describe('SharedFiles (e2e)', () => {
  let app: INestApplication<App>;
  let sequelize: Sequelize;
  let server: App;
  let container: Container;

  let ownerToken: string;
  let userToken: string;
  let userId: string;
  let fileId: string;

  beforeAll(async () => {
    container = await TestContainer.initialize();
    sequelize = container.getSequelize();
    app = container.getApp();
    server = container.getServer();

    const owner = await TestContainer.authenticateUser(UserRoles.OWNER);
    const user = await TestContainer.authenticateUser(UserRoles.USER);

    ownerToken = owner.auth_token;
    userToken = user.auth_token;
    userId = user.user.userId;
  });

  afterAll(async () => {
    await sequelize.truncate();
    await sequelize.drop();
    await container.cleanUploads();
    await app.close();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('Sharing workflow', () => {
    it('should upload a file first', async () => {
      const res = await request(server)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('files', Buffer.from('test content'), 'test.txt');

      expect(res.status).toBe(201);
      const body = res.body as UploadFilesResponseDto;
      expect(body.files).toHaveLength(1);
      fileId = body.files[0].fileId;
    });

    it('should share file with another user', async () => {
      const res = await request(server)
        .post('/api/v1/shared')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId,
          userIds: [userId],
        });

      expect(res.status).toBe(201);
      const body = res.body as SharedFileDto[];
      expect(body[0].fileId).toBe(fileId);
      expect(body[0].userId).toBe(userId);
    });

    it('should see shared file in recipient list', async () => {
      const res = await request(server)
        .get('/api/v1/shared')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const body = res.body as GetFilesResponseDto;
      expect(body.files.some((f) => f.fileId === fileId)).toBe(true);
    });

    it('should create share link', async () => {
      const res = await request(server)
        .post('/api/v1/shared/link')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId,
          ttl: 60,
        })
        .expect(201);

      const body = res.body as ShareLinkResponseDto;
      expect(body.share_link).toBeDefined();
      expect(typeof body.share_link).toBe('string');
      expect(body.share_link.length).toBeGreaterThanOrEqual(1);
    });

    it('should return the same share link if try to create a new one on the already shared file', async () => {
      const res = await request(server)
        .post('/api/v1/shared/link')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId,
          ttl: 60,
        })
        .expect(201);

      const res1 = await request(server)
        .post('/api/v1/shared/link')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId,
          ttl: 60,
        })
        .expect(201);

      const body = res.body as ShareLinkResponseDto;
      const body1 = res1.body as ShareLinkResponseDto;
      expect(body.share_link).toStrictEqual(body1.share_link);
    });

    it('should get file by sharelink', async () => {
      const { share_link } = (
        await request(server)
          .post('/api/v1/shared/link')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            fileId,
            ttl: 1000,
          })
          .expect(201)
      ).body as ShareLinkResponseDto;

      const res = await request(server)
        .get(`/api/v1/shared/${getShareId(share_link)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = res.body as FileDto;
      expect(body.fileId).toEqual(fileId);
    });

    it('should throw if sharelink has expired', async () => {
      const { share_link } = (
        await request(server)
          .post('/api/v1/shared/link')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            fileId,
            ttl: 60,
          })
          .expect(201)
      ).body as ShareLinkResponseDto;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(server)
        .get(`/api/v1/shared/${getShareId(share_link)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should get nested file from shared by link directory', async () => {
      const directory = (
        await request(server)
          .post('/api/v1/directories')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            dirname: 'dir1',
          })
          .expect(201)
      ).body as FileDto;

      const uploadedFile = (
        await request(server)
          .post('/api/v1/files/upload')
          .set('Authorization', `Bearer ${ownerToken}`)
          .query({
            parentId: directory.fileId,
          })
          .attach('files', Buffer.from('test content'), 'test.txt')
          .expect(201)
      ).body as UploadFilesResponseDto;

      const { share_link } = (
        await request(server)
          .post('/api/v1/shared/link')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            fileId: directory.fileId,
            ttl: 1000,
          })
          .expect(201)
      ).body as ShareLinkResponseDto;

      const res = await request(server)
        .get('/api/v1/shared')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          parentId: directory.fileId,
          link: getShareId(share_link),
        })
        .expect(200);

      const body = res.body as GetFilesResponseDto;
      expect(body.files).toHaveLength(1);
      expect(body.files[0].fileId).toEqual(uploadedFile.files[0].fileId);
    });

    it('should get nested file from shared directory', async () => {
      const directory = (
        await request(server)
          .post('/api/v1/directories')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            dirname: 'dir_shared_direct',
          })
          .expect(201)
      ).body as FileDto;

      const uploadedFile = (
        await request(server)
          .post('/api/v1/files/upload')
          .set('Authorization', `Bearer ${ownerToken}`)
          .query({
            parentId: directory.fileId,
          })
          .attach(
            'files',
            Buffer.from('nested direct content'),
            'nested_direct.txt',
          )
          .expect(201)
      ).body as UploadFilesResponseDto;

      await request(server)
        .post('/api/v1/shared')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId: directory.fileId,
          userIds: [userId],
        })
        .expect(201);

      const res = await request(server)
        .get('/api/v1/shared')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          parentId: directory.fileId,
        })
        .expect(200);

      const body = res.body as GetFilesResponseDto;
      expect(body.files).toHaveLength(1);
      expect(body.files[0].fileId).toEqual(uploadedFile.files[0].fileId);
    });

    it('should download shared by link file', async () => {
      const { share_link } = (
        await request(server)
          .post('/api/v1/shared/link')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            fileId,
            ttl: 1000,
          })
          .expect(201)
      ).body as ShareLinkResponseDto;

      const res = await request(server)
        .get(`/api/v1/shared/download/link/${getShareId(share_link)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.text).toBe('test content');
    });

    it('should download shared file as recipient', async () => {
      const res = await request(server)
        .get(`/api/v1/shared/download/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toBe('test content');
    });

    it('should unshare file', async () => {
      const res = await request(server)
        .delete(`/api/v1/shared`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId,
          userIds: [userId],
        });

      expect(res.status).toBe(204);
    });

    it('should no longer see shared file in recipient list', async () => {
      const res = await request(server)
        .get('/api/v1/shared')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const body = res.body as GetFilesResponseDto;
      expect(body.files.some((f) => f.fileId === fileId)).toBe(false);
    });

    it('should fail to download unshared file', async () => {
      const res = await request(server)
        .get(`/api/v1/shared/download/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Error cases', () => {
    it('should fail to share file that does not exist', async () => {
      const res = await request(server)
        .post('/api/v1/shared')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId: '00000000-0000-0000-0000-000000000000',
          userId,
        });

      expect(res.status).toBe(404);
    });

    it('should fail to share file owned by another user', async () => {
      // Create a file for user B
      const uploadRes = await request(server)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', Buffer.from('user content'), 'user.txt');

      const userFileId = (uploadRes.body as UploadFilesResponseDto).files[0]
        .fileId;

      // Owner tries to share user B's file
      const res = await request(server)
        .post('/api/v1/shared')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileId: userFileId,
          userId, // share with himself or anyone else
        });

      expect(res.status).toBe(403);
    });
  });
});
