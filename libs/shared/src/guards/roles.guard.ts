import { ROLES_METADATA_KEY } from '@app/shared/decorators';
import { UserRoles } from '@app/shared/enums';
import { extractUserFromRequest } from '@app/shared/utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const request: Express.Request = context.switchToHttp().getRequest();

    const userRole = extractUserFromRequest(request).role;

    const allowedRoles = this.reflector.getAllAndOverride<UserRoles[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles || userRole === UserRoles.OWNER) {
      return true;
    }

    return allowedRoles.includes(userRole);
  }
}
