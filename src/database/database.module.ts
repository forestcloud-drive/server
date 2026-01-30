import { EnvParams } from '@app/shared/enums';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import { FileModel } from './models/file.model';
import { UserModel } from './models/user.model';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        dialect: 'sqlite',
        storage: configService.getOrThrow<string>(EnvParams.SQLITE_DB),
        models: [UserModel, FileModel],
        autoLoadModels: true,
        sync: { alter: false, force: false },
        logging: (msg): void => Logger.log(msg, DatabaseModule.name),
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([UserModel, FileModel]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
