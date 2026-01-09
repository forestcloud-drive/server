import { AbstractRepository } from '@nestlize/repository';
import { FileModel } from '../database/models/file.model';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createUniqueName } from '@app/shared/utils';
import { MimeTypes } from '@app/shared/enums';
import { Transaction } from 'sequelize';

@Injectable()
export class FilesRepository extends AbstractRepository<FileModel> {
  constructor(
    @InjectModel(FileModel) private readonly fileModel: typeof FileModel,
  ) {
    super(fileModel);
  }

  public async saveFileMetadata(
    file: Express.Multer.File,
    userId: string,
    parentId: string | null = null,
    transaction?: Transaction,
  ): Promise<FileModel> {
    return await this.create(
      {
        userId,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
        parentId,
      },
      { transaction },
    );
  }

  public async saveDirectoryMetadata(
    dirname: string,
    userId: string,
    parentId: string | null = null,
  ): Promise<FileModel> {
    const uniqueFilename = createUniqueName(dirname);

    return await this.create({
      userId,
      fileName: uniqueFilename,
      originalName: dirname,
      mimeType: MimeTypes.DIRECTORY,
      size: 0,
      storagePath: `uploads/${uniqueFilename}`,
      parentId,
    });
  }

  public async getUserFileById(
    fileId: string,
    userId: string,
  ): Promise<FileModel> {
    const file = await this.findOne({
      fileId,
      userId,
    });

    if (!file) {
      throw new NotFoundException(`File not found by ${fileId} id`);
    }

    return file;
  }

  public async renameDirectory(
    dirname: string,
    directoryId: string,
  ): Promise<FileModel> {
    const uniqueName = createUniqueName(dirname);

    const updatedDirectory = await this.updateByPk(directoryId, {
      originalName: dirname,
      fileName: uniqueName,
      storagePath: `uploads/${uniqueName}`,
    });

    if (!updatedDirectory) {
      throw new NotFoundException(`Directory not found by ${directoryId} id`);
    }

    return updatedDirectory;
  }
}
