import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileDto, SharedFileDto } from '@app/shared/dtos';
import { toFileDto, toSharedFileDto } from '@app/shared/builders';
import e from 'express';
import { FilesDownloadService } from '@app/shared/services';
import { EnvParams, MimeTypes } from '@app/shared/enums';
import { Op, Transaction } from 'sequelize';
import { v7 as uuiv7 } from 'uuid';
import { ConfigService } from '@nestjs/config';

import { GetFilesResponseDto } from '../directories/dto/get-files-response.dto';
import { FilesRepository } from '../files/files.repository';
import { FileModel } from '../database/models/file.model';
import { ShareLinkModel } from '../database/models/share-link.model';

import { SharedFilesRepository } from './shared-files.repository';
import { ShareLinkResponseDto } from './dto/share-link-response.dto';
import { ShareLinkRepository } from './share-link.repository';

@Injectable()
export class SharedFilesService {
  constructor(
    private readonly sharedFileRepository: SharedFilesRepository,
    private readonly filesRepository: FilesRepository,
    private readonly downloadsService: FilesDownloadService,
    private readonly shareLinkRepository: ShareLinkRepository,
    private readonly config: ConfigService,
  ) {}

  public async create(
    fileId: string,
    userIds: string[],
  ): Promise<SharedFileDto[]> {
    const sharedDtos = userIds.map((userId) => ({ userId, fileId }));

    const shared = await this.sharedFileRepository.insertMany(sharedDtos);

    return shared.map(toSharedFileDto);
  }

  public async createShareLink(
    fileId: string,
    ttl: number,
  ): Promise<ShareLinkResponseDto> {
    let share_link: ShareLinkModel | null = null;

    share_link = await this.shareLinkRepository.findOne({
      fileId,
    });

    if (share_link) {
      share_link = await this.shareLinkRepository.updateByPk(share_link.id, {
        expiresAt: new Date(Date.now() + ttl),
      });
    } else {
      share_link = await this.shareLinkRepository.create({
        id: uuiv7(),
        fileId,
        expiresAt: new Date(Date.now() + ttl),
      });
    }

    const clientUrl = this.config.get<string>(EnvParams.CLIENT_URL);

    return { share_link: `${clientUrl}/shared/${share_link!.id}` };
  }

  public async findOne(shareLinkId: string): Promise<FileDto> {
    const sharedFile = await this.validateShareLink(shareLinkId);

    return toFileDto(sharedFile.file);
  }

  public async findAll(
    userId: string,
    parentId?: string,
    shareLinkId?: string,
  ): Promise<GetFilesResponseDto> {
    if (!parentId && shareLinkId) {
      throw new BadRequestException('Directory ID must be provided');
    }

    if (shareLinkId) {
      const sharedFile = await this.validateShareLink(shareLinkId);

      if (sharedFile.file.fileId === parentId) {
        const files = await this.filesRepository.findAll({ parentId });

        return { files: files.map(toFileDto) };
      }
    }

    if (!parentId) {
      const files = await this.sharedFileRepository.getAllFiles(userId);

      return { files: files.map(toFileDto) };
    }

    const hasAccess = await this.checkAccess(userId, parentId, shareLinkId);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Directory not found by ${parentId} id or access denied`,
      );
    }

    const files = await this.filesRepository.findAll({ parentId });

    return { files: files.map(toFileDto) };
  }

  public async download(
    fileId: string,
    userId: string,
    response: e.Response,
  ): Promise<FileDto> {
    const sharedFile =
      await this.sharedFileRepository.getSharedFileByFileId(fileId);

    if (sharedFile.userId === userId) {
      return this.downloadsService.downloadFile(sharedFile.file, response);
    }

    const hasAccess = await this.checkAccess(userId, sharedFile.file.parentId!);

    if (!hasAccess) {
      throw new ForbiddenException('File not found or access denied');
    }

    if (sharedFile.file.mimeType === String(MimeTypes.DIRECTORY)) {
      return this.downloadsService.downloadDirectory(sharedFile.file, response);
    }

    return this.downloadsService.downloadFile(sharedFile.file, response);
  }

  public async downloadByLink(
    fileId: string,
    response: e.Response,
  ): Promise<FileDto> {
    const sharedFile = await this.validateShareLink(fileId);

    if (sharedFile.file.mimeType === String(MimeTypes.DIRECTORY)) {
      return this.downloadsService.downloadDirectory(sharedFile.file, response);
    }

    return this.downloadsService.downloadFile(sharedFile.file, response);
  }

  public async remove(fileId: string, userIds: string[]): Promise<HttpStatus> {
    await this.sharedFileRepository.deleteAll({
      fileId,
      userId: { [Op.in]: userIds },
    });

    return HttpStatus.NO_CONTENT;
  }

  private async checkAccess(
    userId: string,
    parentId: string,
    shareLinkId?: string,
  ): Promise<boolean> {
    return this.sharedFileRepository.transaction<boolean>(
      async (transaction) => {
        let sharedFile: FileModel | null = null;
        let currentId: string | null = parentId;

        if (shareLinkId) {
          sharedFile = (await this.validateShareLink(shareLinkId, transaction))
            .file;
        }

        while (currentId) {
          if (sharedFile && sharedFile.fileId === currentId) {
            return true;
          }

          const isShared = await this.sharedFileRepository.findOne(
            {
              userId,
              fileId: currentId,
            },
            { transaction },
          );

          if (isShared) return true;

          const directory = await this.filesRepository.findByPk(currentId, {
            attributes: ['parentId'],
            transaction,
          });

          currentId = directory?.parentId || null;
        }

        return false;
      },
    );
  }

  private async validateShareLink(
    shareLinkId: string,
    transaction?: Transaction,
  ): Promise<ShareLinkModel> {
    const sharedFile = await this.shareLinkRepository.findByPk(shareLinkId, {
      include: [{ model: FileModel, required: true }],
      transaction,
    });

    if (!sharedFile) {
      throw new NotFoundException(
        `File not found by share link id: ${shareLinkId}`,
      );
    }

    if (sharedFile.expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Share link has been expired');
    }

    return sharedFile;
  }

  public async deleteExpiredLinks(): Promise<number> {
    return this.shareLinkRepository.deleteExpiredLinks();
  }
}
