import { UserRoles } from '@app/shared/enums';
import { extractUserFromRequest } from '@app/shared/utils';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import e from 'express';

import { AdminUserRepository } from '../../../../src/admin/users/admin-user.repository';

@Injectable()
export class OperateOnUserPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: e.Request = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(request);
    const targetUserId = request.params.userId;

    if (user.role === UserRoles.OWNER) {
      return true;
    }

    if (user.role !== UserRoles.ADMIN) {
      return false;
    }

    if (!targetUserId) {
      throw new BadRequestException(`'userId' route parameter is required`);
    }

    const targetUser = await this.adminUserRepository.findByPk(targetUserId);

    if (!targetUser) {
      throw new NotFoundException(`User not found by '${targetUserId}' id`);
    }

    if (targetUser.role !== UserRoles.USER) {
      throw new ForbiddenException(`Can perform operation only on role 'user'`);
    }

    return true;
  }
}
