import { BaseModel } from '@nestlize/repository';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { FileModel } from './file.model';
import { UserModel } from './user.model';

export interface SharedFilesCreationAttributes {
  fileId: string;
  userId: string;
}

@Table({ tableName: 'shared_files', paranoid: false, timestamps: false })
export class SharedFilesModel extends BaseModel<
  SharedFilesModel,
  SharedFilesCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => FileModel)
  @Column
  declare fileId: string;

  @AllowNull(false)
  @ForeignKey(() => UserModel)
  @Column
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @BelongsTo(() => FileModel)
  declare file: FileModel;
}
