import type { CustomDecorator } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { RequestContext } from '@app/shared/enums';

export const ACCESS_PERMISSION_KEY = 'ACCESS_PERMISSION_KEY';
export const AccessPermission = <T>(
  accessToId: string | keyof T,
  context: RequestContext = RequestContext.PARAMS,
): CustomDecorator<string> =>
  SetMetadata(ACCESS_PERMISSION_KEY, { accessToId, context });
