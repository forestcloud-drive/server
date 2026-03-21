import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { FileDto, SharedFileDto } from '@app/shared/dtos';
import { toFileDto, toSharedFileDto } from '@app/shared/builders';
import e from 'express';
import { FilesDownloadService } from '@app/shared/services';
import { MimeTypes } from '@app/shared/enums';
import { Op } from 'sequelize';

import { GetFilesResponseDto } from '../directories/dto/get-files-response.dto';
import { FilesRepository } from '../files/files.repository';

import { SharedFilesRepository } from './shared-files.repository';

@Injectable()
export class SharedFilesService {
  constructor(
    private readonly sharedFileRepository: SharedFilesRepository,
    private readonly filesRepository: FilesRepository,
    private readonly downloadsService: FilesDownloadService,
  ) {}

  public async create(
    fileId: string,
    userIds: string[],
  ): Promise<SharedFileDto[]> {
    const sharedDtos = userIds.map((userId) => ({ userId, fileId }));

    const shared = await this.sharedFileRepository.insertMany(sharedDtos);

    return shared.map(toSharedFileDto);
  }

  public async findAll(
    userId: string,
    parentId?: string,
  ): Promise<GetFilesResponseDto> {
    if (!parentId) {
      const files = await this.sharedFileRepository.getAllFiles(userId);

      return { files: files.map(toFileDto) };
    }

    const hasAccess = await this.checkAccess(userId, parentId);

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
  ): Promise<boolean> {
    return this.sharedFileRepository.transaction<boolean>(
      async (transaction) => {
        let currentId: string | null = parentId;

        while (currentId) {
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
}
