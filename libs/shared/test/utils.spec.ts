import {
  createUniqueName,
  extractFilename,
  extractUserFromRequest,
} from '@app/shared/utils';
import { InternalServerErrorException } from '@nestjs/common';

describe('Utils', () => {
  describe('Filename', () => {
    const file = {
      originalname: 'my-file.txt',
    } as Express.Multer.File;

    it('Should generate unique filename', () => {
      const filename = createUniqueName(file.originalname);

      expect(filename).not.toBe(file.originalname);
      expect(filename.split('_')).toHaveLength(2);
    });

    it('Should extract filename from generated', () => {
      const filename = createUniqueName(file.originalname);
      const extracted = extractFilename(filename);

      expect(extracted).toBe(file.originalname);
    });
  });

  describe('extractUserFromRequest', () => {
    const mockUser = { userId: 123, username: 'test' };

    it('should return user if payload is valid', () => {
      const req = { user: mockUser } as unknown as Express.Request;
      const result = extractUserFromRequest(req);
      expect(result).toBe(mockUser);
    });

    it('should throw InternalServerErrorException if user payload is invalid', () => {
      const req = {
        user: { name: 'not-a-user' },
      } as unknown as Express.Request;
      expect(() => extractUserFromRequest(req)).toThrow(
        InternalServerErrorException,
      );
      expect(() => extractUserFromRequest(req)).toThrow(
        'Cannot extract user from request',
      );
    });
  });
});
