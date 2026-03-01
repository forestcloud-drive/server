import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';

import { SharedFilesService } from './shared-files.service';
import { SharedFilesController } from './shared-files.controller';
import { SharedFilesRepository } from './shared-files.repository';

@Module({
  imports: [FilesModule],
  controllers: [SharedFilesController],
  providers: [SharedFilesService, SharedFilesRepository],
})
export class SharedFilesModule {}
