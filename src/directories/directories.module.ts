import { ValidateParentFile } from '@app/shared/validators';
import { Module } from '@nestjs/common';
import { FilesDownloadService } from '@app/shared/services';

import { FilesRepository } from '../files/files.repository';
import { FilesService } from '../files/files.service';
import { SharedFilesRepository } from '../shared-files/shared-files.repository';
import { ShareLinkRepository } from '../shared-files/share-link.repository';

import { DirectoriesController } from './directories.controller';
import { DirectoriesService } from './directories.service';

@Module({
  controllers: [DirectoriesController],
  providers: [
    DirectoriesService,
    FilesRepository,
    ValidateParentFile,
    FilesService,
    FilesDownloadService,
    SharedFilesRepository,
    ShareLinkRepository,
  ],
})
export class DirectoriesModule {}
