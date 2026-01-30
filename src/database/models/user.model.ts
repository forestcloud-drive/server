import { UserRoles } from '@app/shared/enums';
import { BaseModel } from '@nestlize/repository';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import { FileModel } from './file.model';

export interface UserCreationAttributes {
  fullname: string;
  email: string;
  password: string;
  role?: UserRoles;
  hasAccess?: boolean;
  mustChangePassword?: boolean;
}

@Table({ tableName: 'users', timestamps: true, paranoid: true })
export class UserModel extends BaseModel<UserModel, UserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare userId: string;

  @AllowNull(false)
  @Column
  declare fullname: string;

  @Unique
  @AllowNull(false)
  @Column
  declare email: string;

  @AllowNull(false)
  @Column
  declare password: string;

  @AllowNull(false)
  @Default(UserRoles.USER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRoles)),
  })
  declare role: UserRoles;

  @AllowNull
  @Default(false)
  @Column
  declare hasAccess: boolean;

  @AllowNull
  @Default(false)
  @Column
  declare mustChangePassword: boolean;

  @HasMany(() => FileModel)
  declare files: FileModel[];
}
