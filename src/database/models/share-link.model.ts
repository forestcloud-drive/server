import { BaseModel } from '@nestlize/repository';
import {
  AllowNull,
  BelongsTo,
  Column,
  ForeignKey,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import { FileModel } from './file.model';

export interface ShareLinkModelCreationAttributes {
  id: string;
  fileId: string;
  expiresAt?: Date;
}

@Table({ tableName: 'share_links', paranoid: false, timestamps: false })
export class ShareLinkModel extends BaseModel<
  ShareLinkModel,
  ShareLinkModelCreationAttributes
> {
  @PrimaryKey
  @Column
  declare id: string;

  @Unique
  @AllowNull(false)
  @ForeignKey(() => FileModel)
  @Column
  declare fileId: string;

  @AllowNull(false)
  @Column
  declare expiresAt: Date;

  @BelongsTo(() => FileModel)
  declare file: FileModel;
}
