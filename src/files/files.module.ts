import { ValidateParentFile } from '@app/shared/validators';
import { Module } from '@nestjs/common';

import { MulterModule } from '../multer/multer.module';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
  imports: [MulterModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository, ValidateParentFile],
})
export class FilesModule {}
