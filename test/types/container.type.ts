import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { Sequelize } from 'sequelize-typescript';
import type { UserRoles } from '@app/shared/enums';

import type { SignupResponseDto } from '../../src/auth/dto/signup-response.dto';

export interface Container {
  authenticateUser(
    role: UserRoles,
    hasAccess?: boolean,
  ): Promise<SignupResponseDto>;
  cleanUploads(): Promise<void>;
  getApp(): INestApplication<App>;
  getSequelize(): Sequelize;
  getServer(): App;
}
