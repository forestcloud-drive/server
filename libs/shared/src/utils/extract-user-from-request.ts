import type { UserPayloadDto } from '@app/shared/dtos';
import { InternalServerErrorException } from '@nestjs/common';

const isUserPayload = (user?: Express.User): user is UserPayloadDto => {
  if (!user) return false;

  return 'userId' in user;
};

export const extractUserFromRequest = (
  request: Express.Request,
): UserPayloadDto => {
  if (!isUserPayload(request.user)) {
    throw new InternalServerErrorException('Cannot extract user from request');
  }

  return request.user;
};
