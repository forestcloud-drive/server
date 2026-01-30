import { EnvParams } from '@app/shared/enums';
import { createUniqueName } from '@app/shared/utils';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule as PlatformExpressMulter } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    PlatformExpressMulter.registerAsync({
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: config.getOrThrow<string>(EnvParams.UPLOADS_DEST),
          filename: (_req, file, callback) => {
            const fileName = createUniqueName(file.originalname);
            callback(null, fileName);
          },
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [PlatformExpressMulter],
})
export class MulterModule {}
