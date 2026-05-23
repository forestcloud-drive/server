import { AbstractRepository } from '@nestlize/repository';
import { InjectModel } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';

import { SharedFilesModel } from '../database/models/shared-files.model';
import { FileModel } from '../database/models/file.model';

export class SharedFilesRepository extends AbstractRepository<SharedFilesModel> {
  constructor(
    @InjectModel(SharedFilesModel)
    private readonly model: typeof SharedFilesModel,
  ) {
    super(model);
  }

  public async getSharedFileByFileId(
    fileId: string,
  ): Promise<SharedFilesModel> {
    const file = await this.findOne(
      { fileId },
      {
        include: [{ model: FileModel, required: true }],
      },
    );

    if (!file) {
      throw new NotFoundException('File not found or access denied');
    }

    return file;
  }

  public async getAllFiles(userId: string): Promise<FileModel[]> {
    const files = await this.findAll(
      { userId },
      {
        include: [
          {
            model: FileModel,
            required: true,
          },
        ],
      },
    );

    return files.map((file) => file.file);
  }
}
