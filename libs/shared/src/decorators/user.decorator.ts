import { UserPayloadDto } from '@app/shared/dtos';
import { extractUserFromRequest } from '@app/shared/utils';
import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

export const User = createParamDecorator(
  (data: keyof UserPayloadDto, context: ExecutionContext) => {
    const request: Express.Request = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(request);

    if (data) {
      return user[data];
    }

    return plainToInstance(UserPayloadDto, user, {
      excludeExtraneousValues: true,
    });
  },
);
