import { AbstractRepository } from '@nestlize/repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { ShareLinkModel } from '../database/models/share-link.model';

@Injectable()
export class ShareLinkRepository extends AbstractRepository<ShareLinkModel> {
  constructor(
    @InjectModel(ShareLinkModel) private readonly model: typeof ShareLinkModel,
  ) {
    super(model);
  }
}
