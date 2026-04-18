import { BaseModel } from '@nestlize/repository';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { UserModel } from './user.model';
import { SharedFilesModel } from './shared-files.model';
import { ShareLinkModel } from './share-link.model';

export interface FileCreationAttributes {
  userId: string;
  parentId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

@Table({ tableName: 'files_metadata', paranoid: true, timestamps: true })
export class FileModel extends BaseModel<FileModel, FileCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare fileId: string;

  @AllowNull(false)
  @ForeignKey(() => UserModel)
  @Column
  declare userId: string;

  @AllowNull
  @Default(null)
  @ForeignKey(() => FileModel)
  @Column({ type: DataType.STRING })
  declare parentId: string | null;

  @AllowNull(false)
  @Column
  declare fileName: string;

  @AllowNull(false)
  @Column
  declare originalName: string;

  @AllowNull(false)
  @Column
  declare mimeType: string;

  @AllowNull(false)
  @Column
  declare size: number;

  @AllowNull(false)
  @Column
  declare storagePath: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @BelongsTo(() => FileModel)
  declare parent: FileModel;

  @HasMany(() => FileModel)
  declare children: FileModel[];

  @HasMany(() => SharedFilesModel)
  declare shared: SharedFilesModel[];

  @HasMany(() => ShareLinkModel)
  declare share_links: ShareLinkModel[];
}
