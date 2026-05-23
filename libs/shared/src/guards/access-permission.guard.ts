import { ACCESS_PERMISSION_KEY } from '@app/shared/decorators';
import { extractUserFromRequest } from '@app/shared/utils';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import e from 'express';
import { RequestContext } from '@app/shared/enums';

import { FilesRepository } from '../../../../src/files/files.repository';

@Injectable()
export class AccessPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly filesRepository: FilesRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: e.Request = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(request);

    const { accessToId, context: ctx } = this.reflector.getAllAndOverride<{
      accessToId: string;
      context: RequestContext;
    }>(ACCESS_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const bucket = request[ctx] as Record<string, unknown> | undefined;
    const fileId = bucket?.[accessToId] as string | undefined;

    if (!fileId) {
      return true;
    }

    const foundRecord = await this.filesRepository.findOne(
      {
        fileId: fileId,
      },
      {
        paranoid: false,
      },
    );

    if (!foundRecord) {
      throw new NotFoundException(
        `File or directory not found by ${fileId} id`,
      );
    }

    return Boolean(foundRecord.userId === user.userId);
  }
}
