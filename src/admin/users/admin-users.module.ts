import { Module } from '@nestjs/common';

import { AdminUserRepository } from './admin-user.repository';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUserRepository],
})
export class AdminUsersModule {}
