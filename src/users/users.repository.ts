import { AbstractRepository } from 'nest-sequelize-repository';
import { UserModel } from '../database/models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class UsersRepository extends AbstractRepository<UserModel> {
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {
    super(userModel, {
      idGenerator: uuidv7,
      autoGenerateId: true,
      idField: 'userId',
    });
  }
}
