import * as fs from 'node:fs/promises';

import { toFileDto } from '@app/shared/builders';
import { FileDto } from '@app/shared/dtos';
import { MimeTypes } from '@app/shared/enums';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import e from 'express';
import { Op, Transaction } from 'sequelize';
import { FilesDownloadService } from '@app/shared/services';
import { useInnerError } from '@app/shared/helpers';

import { SharedFilesRepository } from '../shared-files/shared-files.repository';
import { ShareLinkRepository } from '../shared-files/share-link.repository';

import { UploadFilesResponseDto } from './dto/upload-files-response.dto';
import { FilesRepository } from './files.repository';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly downloadsService: FilesDownloadService,
    private readonly sharedFilesRepository: SharedFilesRepository,
    private readonly shareLinksRepository: ShareLinkRepository,
  ) {}

  public async uploadFiles(
    files: Express.Multer.File[],
    userId: string,
    parentId?: string,
  ): Promise<UploadFilesResponseDto> {
    return await this.filesRepository.transaction(async (transaction) => {
      const fileDtos: FileDto[] = [];
      let totalSize = 0;

      for (const file of files) {
        const fileMetadata = await this.filesRepository.saveFileMetadata(
          file,
          userId,
          parentId,
          transaction,
        );

        totalSize += fileMetadata.size;
        fileDtos.push(toFileDto(fileMetadata));
      }

      if (parentId) {
        await this.resizeParentDirectory(parentId, totalSize, transaction);
      }

      return { files: fileDtos };
    });
  }

  public async download(
    fileId: string,
    userId: string,
    response: e.Response,
  ): Promise<FileDto> {
    const file = await this.filesRepository.getUserFileById(fileId, userId);

    if (file.mimeType === String(MimeTypes.DIRECTORY)) {
      return this.downloadsService.downloadDirectory(file, response, userId);
    }

    return this.downloadsService.downloadFile(file, response);
  }

  private async resizeParentDirectory(
    parentId: string,
    childSize: number,
    transaction?: Transaction,
  ): Promise<void> {
    let currentParentId: string | null = parentId;
    let accumulatedSize: number = childSize;

    while (currentParentId) {
      const parentFile = await this.filesRepository.findByPk(currentParentId, {
        transaction,
      });

      if (!parentFile) {
        throw new NotFoundException('Parent directory not found');
      }

      if (parentFile.mimeType !== 'text/directory') {
        throw new BadRequestException('Parent file is not a directory');
      }

      const newSize = parentFile.size + accumulatedSize;

      await this.filesRepository.updateByPk(
        currentParentId,
        {
          size: newSize,
        },
        { transaction },
      );

      accumulatedSize = newSize;
      currentParentId = parentFile.parentId;
    }
  }

  public async moveToTrash(fileId: string): Promise<FileDto> {
    const trashedFile = await this.filesRepository.deleteByPk(fileId);

    if (!trashedFile) {
      throw new NotFoundException(`File not found by ${fileId} id`);
    }

    await this.deleteSharings(trashedFile.fileId);

    return toFileDto(trashedFile);
  }

  public async restoreFile(fileId: string): Promise<FileDto> {
    const restoredFile = await this.filesRepository.restoreByPk(fileId);

    if (!restoredFile) {
      throw new NotFoundException(`File not found by ${fileId} id`);
    }

    return toFileDto(restoredFile);
  }

  public async deleteFile(fileId: string): Promise<FileDto> {
    const fileToDelete = await this.filesRepository.findByPk(fileId, {
      paranoid: false,
    });

    if (!fileToDelete) {
      throw new NotFoundException(`File not found by ${fileId} id`);
    }

    try {
      const { resolvedPath } =
        this.downloadsService.resolveAndCheckPath(fileToDelete);

      await fs.unlink(resolvedPath);
    } catch (error: any) {
      this.logger.log(`rm: ${error}`);
      throw new InternalServerErrorException();
    }

    const deletedFile = await this.filesRepository.deleteByPk(fileId, {
      force: true,
    });

    if (!deletedFile) {
      this.logger.error(useInnerError('FDE'));
      throw new InternalServerErrorException('Something went wrong');
    }

    await this.deleteSharings(deletedFile.fileId);

    return toFileDto(deletedFile);
  }

  public async deleteSharings(fileId: string): Promise<void> {
    const sharedFile = await this.sharedFilesRepository.findOne({
      fileId,
    });
    const shareLink = await this.shareLinksRepository.findOne({
      fileId,
    });

    if (sharedFile) {
      await this.sharedFilesRepository.deleteByPk(sharedFile.fileId);
    }

    if (shareLink) {
      await this.shareLinksRepository.deleteByPk(shareLink.fileId);
    }
  }

  public async moveFile(fileId: string, targetDir: string): Promise<FileDto> {
    const parentId = targetDir === 'root' ? null : targetDir;

    const updatedDirectory = await this.filesRepository.updateByPk(fileId, {
      parentId,
    });

    if (!updatedDirectory) {
      throw new NotFoundException(`Directory not found by id ${fileId}`);
    }

    return toFileDto(updatedDirectory);
  }

  public async getTrashedFiles(
    userId: string,
    parentId?: string,
  ): Promise<FileDto[]> {
    const files = await this.filesRepository.findAll(
      {
        ...(parentId
          ? {
              parentId,
            }
          : {
              deletedAt: {
                [Op.not]: null,
              },
            }),
        userId,
      },
      { paranoid: false },
    );

    return files.map(toFileDto);
  }
}
