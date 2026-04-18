import { toFileDto } from '@app/shared/builders';
import { FileDto } from '@app/shared/dtos';
import { Injectable, NotFoundException } from '@nestjs/common';

import { FilesRepository } from '../files/files.repository';

import { CreateDirectoryBodyDto } from './dto/create-directory-body.dto';
import { GetFilesResponseDto } from './dto/get-files-response.dto';

@Injectable()
export class DirectoriesService {
  constructor(private readonly filesRepository: FilesRepository) {}

  public async createDirectory(
    createDirectoryDto: CreateDirectoryBodyDto,
    userId: string,
    parentId?: string,
  ): Promise<FileDto> {
    const fileMetadata = await this.filesRepository.saveDirectoryMetadata(
      createDirectoryDto.dirname,
      userId,
      parentId,
    );

    return toFileDto(fileMetadata);
  }

  public async getFiles(
    userId: string,
    parentId?: string,
  ): Promise<GetFilesResponseDto> {
    const files = await this.filesRepository.findAll({
      userId,
      parentId: parentId ?? null,
    });

    const mappedFiles = files.map((file) => toFileDto(file));

    return { files: mappedFiles };
  }

  public async renameDirectory(
    directoryId: string,
    dirname: string,
  ): Promise<FileDto> {
    const updatedDirectory = await this.filesRepository.renameDirectory(
      dirname,
      directoryId,
    );

    return toFileDto(updatedDirectory);
  }

  public async trashDirectory(directoryId: string): Promise<FileDto> {
    const trashedDirectory = await this.filesRepository.deleteByPk(directoryId);

    if (!trashedDirectory) {
      throw new NotFoundException(`Directory not found by ${directoryId} id`);
    }

    return toFileDto(trashedDirectory);
  }

  public async deleteDirectory(directoryId: string): Promise<FileDto> {
    const deletedDirectory = await this.filesRepository.deleteByPk(
      directoryId,
      {
        force: true,
      },
    );

    if (!deletedDirectory) {
      throw new NotFoundException(`Directory not found by ${directoryId} id`);
    }

    return toFileDto(deletedDirectory);
  }

  public async restoreDirectory(directoryId: string): Promise<FileDto> {
    const restoredDirectory =
      await this.filesRepository.restoreByPk(directoryId);

    if (!restoredDirectory) {
      throw new NotFoundException(`Directory not found by ${directoryId} id`);
    }

    return toFileDto(restoredDirectory);
  }
}
