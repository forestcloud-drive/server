import * as path from 'path';

import { BadRequestException } from '@nestjs/common';

import {
  createFileDto,
  resolveAndCheckPath,
} from './mocks/resolve-and-check-path.mock';

describe('resolveAndCheckPath', () => {
  const uploadsDir = path.resolve('./uploads');

  it('should resolve a valid path inside uploads directory', () => {
    const file = createFileDto('./uploads/file.txt');

    const result = resolveAndCheckPath(file);

    expect(result.baseDir).toBe(uploadsDir);
    expect(result.resolvedPath).toBe(path.resolve('./uploads/file.txt'));
  });

  it('should allow nested paths inside uploads directory', () => {
    const file = createFileDto('./uploads/subdir/file.txt');

    const result = resolveAndCheckPath(file);

    expect(result.resolvedPath.startsWith(result.baseDir)).toBe(true);
  });

  it('should throw BadRequestException for path outside uploads directory', () => {
    const file = createFileDto('/etc/passwd');

    expect(() => resolveAndCheckPath(file)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for path traversal attack', () => {
    const file = createFileDto('./uploads/../outside.txt');

    expect(() => resolveAndCheckPath(file)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException when resolved path escapes baseDir', () => {
    const outsidePath = path.resolve('./outside/file.txt');
    const file = createFileDto(outsidePath);

    expect(() => resolveAndCheckPath(file)).toThrow('Unsafe path access');
  });
});
