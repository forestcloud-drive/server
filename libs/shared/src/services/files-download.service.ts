import * as path from 'path';

import e from 'express';
import { FileDto } from '@app/shared/dtos';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { toFileDto } from '@app/shared/builders';
import * as archiver from 'archiver';
import { EnvParams, MimeTypes } from '@app/shared/enums';
import { ConfigService } from '@nestjs/config';

import { FileModel } from '../../../../src/database/models/file.model';
import { FilesRepository } from '../../../../src/files/files.repository';

@Injectable()
export class FilesDownloadService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly filesRepository: FilesRepository,
  ) {}

  public async downloadFile(
    file: FileModel,
    response: e.Response,
  ): Promise<FileDto> {
    const { resolvedPath } = this.resolveAndCheckPath(file);

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

  public async downloadDirectory(
    directory: FileModel,
    response: e.Response,
    userId?: string,
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

      this.addDirectoryContentsToArchive({ archive, directory, userId })
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
    userId,
    basePath = '',
  }: {
    archive: archiver.Archiver;
    directory: FileModel;
    userId?: string;
    basePath?: string;
  }): Promise<void> {
    const children = await this.filesRepository.findAll({
      parentId: directory.fileId,
      userId,
    });

    for (const child of children) {
      const relativePath = path.join(basePath, child.originalName);

      if (child.mimeType === String(MimeTypes.DIRECTORY)) {
        archive.append('', { name: relativePath + '/' });

        await this.addDirectoryContentsToArchive({
          archive,
          userId,
          basePath: relativePath,
          directory: child,
        });
      } else {
        const { resolvedPath } = this.resolveAndCheckPath(child);

        archive.file(resolvedPath, { name: relativePath });
      }
    }
  }

  public resolveAndCheckPath(file: FileDto): {
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
