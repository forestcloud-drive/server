import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AbstractRepository } from '@nestlize/repository';

import { UserModel } from '../database/models/user.model';

@Injectable()
export class UsersRepository extends AbstractRepository<UserModel> {
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {
    super(userModel);
  }
}
