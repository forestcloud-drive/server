import * as path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AdminUsersModule } from './admin/users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigValidationService } from './config/config-validation.service';
import { DatabaseModule } from './database/database.module';
import { DirectoriesModule } from './directories/directories.module';
import { FilesModule } from './files/files.module';
import { LoggerModule } from './logger/logger.module';
import { MulterModule } from './multer/multer.module';
import { UsersModule } from './users/users.module';
import { SharedFilesModule } from './shared-files/shared-files.module';

@Module({
  imports: [
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '../client'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: ConfigValidationService.createSchema(),
    }),
    LoggerModule,
    AdminUsersModule,
    UsersModule,
    AuthModule,
    FilesModule,
    MulterModule,
    DirectoriesModule,
    SharedFilesModule,
  ],
})
export class AppModule {}
