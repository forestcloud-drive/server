import * as path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FileDto, SharedFileDto } from '@app/shared/dtos';
import { toFileDto, toSharedFileDto } from '@app/shared/builders';
import e from 'express';
import * as archiver from 'archiver';
import { EnvParams, MimeTypes } from '@app/shared/enums';
import { ConfigService } from '@nestjs/config';

import { GetFilesResponseDto } from '../directories/dto/get-files-response.dto';
import { FilesRepository } from '../files/files.repository';
import { FileModel } from '../database/models/file.model';

import { SharedFilesRepository } from './shared-files.repository';

@Injectable()
export class SharedFilesService {
  private readonly logger = new Logger(SharedFilesService.name);

  constructor(
    private readonly sharedFileRepository: SharedFilesRepository,
    private readonly filesRepository: FilesRepository,
    private readonly config: ConfigService,
  ) {}

  public async create(fileId: string, userId: string): Promise<SharedFileDto> {
    const shared = await this.sharedFileRepository.create({
      fileId,
      userId,
    });

    return toSharedFileDto(shared);
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
      return this.downloadFile(sharedFile.file, response);
    }

    const hasAccess = await this.checkAccess(userId, sharedFile.file.parentId!);

    if (!hasAccess) {
      throw new ForbiddenException('File not found or access denied');
    }

    if (sharedFile.file.mimeType === 'text/directory') {
      return this.downloadDirectory(sharedFile.file, response);
    }

    return this.downloadFile(sharedFile.file, response);
  }

  public async remove(fileId: string, userId: string): Promise<HttpStatus> {
    const file = await this.sharedFileRepository.findOne({
      fileId,
      userId,
    });

    if (!file) {
      throw new NotFoundException();
    }

    await this.sharedFileRepository.deleteByPk(file.id, {
      force: true,
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

  private downloadFile(
    file: FileModel,
    response: e.Response,
  ): Promise<FileDto> {
    const { resolvedPath, baseDir } = this.resolveAndCheckPath(file);

    if (!resolvedPath.startsWith(baseDir)) {
      throw new BadRequestException('Unsafe path access');
    }

    return new Promise<FileDto>((resolve, reject) => {
      response.download(resolvedPath, file.originalName, (error: Error) => {
        if (error) {
          this.logger.error(`downloadFile: ${error}`);
          response.status(500).end();
          reject(error);
        }

        resolve(toFileDto(file));
      });
    });
  }

  private downloadDirectory(
    directory: FileModel,
    response: e.Response,
  ): Promise<FileDto> {
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${directory.originalName || directory.fileName}.zip"`,
    );
    response.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(response);

    return new Promise<FileDto>((resolve, reject) => {
      archive.on('error', (error: Error) => {
        this.logger.error(`archive: ${error}`);
        response.status(500).end();
        reject(error);
      });

      archive.on('finish', () => {
        resolve(toFileDto(directory));
      });

      this.addDirectoryContentsToArchive({ archive, directory })
        .then(() => archive.finalize())
        .catch((error: Error) => {
          this.logger.error(`downloadDirectory: ${error}`);
          response.status(500).end();
          reject(error);
        });
    });
  }

  private async addDirectoryContentsToArchive({
    archive,
    directory,
    basePath = '',
  }: {
    archive: archiver.Archiver;
    directory: FileModel;
    basePath?: string;
  }): Promise<void> {
    const children = await this.filesRepository.findAll({
      parentId: directory.fileId,
    });

    for (const child of children) {
      const relativePath = path.join(basePath, child.originalName);

      if (child.mimeType === String(MimeTypes.DIRECTORY)) {
        archive.append('', { name: relativePath + '/' });

        await this.addDirectoryContentsToArchive({
          archive,
          basePath: relativePath,
          directory: child,
        });
      } else {
        const { resolvedPath } = this.resolveAndCheckPath(child);

        archive.file(resolvedPath, { name: relativePath });
      }
    }
  }

  private resolveAndCheckPath(file: FileDto): {
    resolvedPath: string;
    baseDir: string;
  } {
    const uploadsDestination = this.config.getOrThrow<string>(
      EnvParams.UPLOADS_DEST,
    );
    const baseDir = path.resolve(uploadsDestination);

    const resolvedPath = path.resolve(file.storagePath);

    if (!resolvedPath.startsWith(baseDir)) {
      throw new BadRequestException('Unsafe path access');
    }

    return { resolvedPath, baseDir };
  }
}
