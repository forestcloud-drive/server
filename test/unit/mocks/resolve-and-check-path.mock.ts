import * as path from 'path';

import type { FileDto } from '@app/shared/dtos';
import { BadRequestException } from '@nestjs/common';

export const resolveAndCheckPath = (
  file: FileDto,
): {
  resolvedPath: string;
  baseDir: string;
} => {
  const uploadsDestination = './uploads';

  const baseDir = path.resolve(uploadsDestination);

  const resolvedPath = path.resolve(file.storagePath);

  if (!resolvedPath.startsWith(baseDir)) {
    throw new BadRequestException('Unsafe path access');
  }

  return { resolvedPath, baseDir };
};

export const createFileDto = (storagePath: string): FileDto =>
  ({
    storagePath,
  }) as FileDto;
