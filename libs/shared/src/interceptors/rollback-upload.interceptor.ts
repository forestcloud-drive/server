import * as fs from 'node:fs/promises';

import * as path from 'path';
import { EnvParams } from '@app/shared/enums';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type e from 'express';
import { finalize, Observable } from 'rxjs';

import { FilesRepository } from '../../../../src/files/files.repository';

@Injectable()
export class RollbackUploadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RollbackUploadInterceptor.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly config: ConfigService,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request: e.Request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      finalize(() => {
        this.cleanUp(request).catch((err) => {
          this.logger.error(`cleanUp: ${err}`);
          throw new InternalServerErrorException();
        });
      }),
    );
  }

  public async cleanUp(request: e.Request): Promise<void> {
    const files = this.getFilesArray(request);
    const uploadsDestination = this.config.getOrThrow<string>(
      EnvParams.UPLOADS_DEST,
    );
    const baseDir = path.resolve(uploadsDestination);

    for (const file of files) {
      if (!file.path) continue;

      const isSaved = await this.filesRepository.findOne({
        storagePath: file.path,
      });

      if (!isSaved) {
        const resolvedPath = path.resolve(file.path);

        if (!resolvedPath.startsWith(baseDir)) {
          this.logger.error(`Unsafe path access for ${resolvedPath}`);
          continue;
        }

        try {
          await fs.unlink(resolvedPath);
        } catch (error: any) {
          this.logger.error(`Failed to delete ${resolvedPath}: ${error}`);
        }
      }
    }
  }

  private getFilesArray(req: e.Request): Express.Multer.File[] {
    if (Array.isArray(req.files)) return req.files;
    if (!req.files) return [];

    return Object.values(req.files).flat();
  }
}
