import { ValidateParentFile } from '@app/shared/validators';
import { Module } from '@nestjs/common';

import { FilesRepository } from '../files/files.repository';

import { DirectoriesController } from './directories.controller';
import { DirectoriesService } from './directories.service';

@Module({
  controllers: [DirectoriesController],
  providers: [DirectoriesService, FilesRepository, ValidateParentFile],
})
export class DirectoriesModule {}
