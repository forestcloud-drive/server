import { Module } from '@nestjs/common';
import { FilesDownloadService } from '@app/shared/services';
import { ValidateParentFile } from '@app/shared/validators';

import { FilesModule } from '../files/files.module';
import { FilesRepository } from '../files/files.repository';

import { SharedFilesService } from './shared-files.service';
import { SharedFilesController } from './shared-files.controller';
import { SharedFilesRepository } from './shared-files.repository';
import { ShareLinkRepository } from './share-link.repository';

@Module({
  imports: [FilesModule],
  controllers: [SharedFilesController],
  providers: [
    SharedFilesService,
    SharedFilesRepository,
    FilesDownloadService,
    ShareLinkRepository,
    ValidateParentFile,
    FilesRepository,
  ],
})
export class SharedFilesModule {}
