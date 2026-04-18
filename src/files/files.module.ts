import { ValidateParentFile } from '@app/shared/validators';
import { Module } from '@nestjs/common';
import { FilesDownloadService } from '@app/shared/services';

import { MulterModule } from '../multer/multer.module';

import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
  imports: [MulterModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    FilesRepository,
    ValidateParentFile,
    FilesDownloadService,
  ],
  exports: [FilesRepository],
})
export class FilesModule {}
