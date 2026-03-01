import { plainToInstance } from 'class-transformer';
import { SharedFileDto } from '@app/shared/dtos';

import type { SharedFilesModel } from '../../../../src/database/models/shared-files.model';

export const toSharedFileDto = (
  sharedFileModel: SharedFilesModel,
): SharedFileDto => {
  return plainToInstance(SharedFileDto, sharedFileModel, {
    excludeExtraneousValues: true,
  });
};
