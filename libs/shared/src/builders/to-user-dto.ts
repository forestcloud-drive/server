import { UserDto } from '@app/shared/dtos';
import { plainToInstance } from 'class-transformer';

import type { UserModel } from '../../../../src/database/models/user.model';

export const toUserDto = (userModel: UserModel): UserDto => {
  return plainToInstance(UserDto, userModel, {
    excludeExtraneousValues: true,
  });
};
