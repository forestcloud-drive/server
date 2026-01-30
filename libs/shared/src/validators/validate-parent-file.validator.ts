import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { FilesRepository } from '../../../../src/files/files.repository';

@Injectable()
@ValidatorConstraint({ async: true })
export class ValidateParentFile implements ValidatorConstraintInterface {
  constructor(private readonly filesRepository: FilesRepository) {}

  public async validate(value: string): Promise<boolean> {
    const parentFile = await this.filesRepository.findByPk(value);

    if (!parentFile) {
      throw new NotFoundException('Parent directory not found');
    }

    if (parentFile.mimeType !== 'text/directory') {
      throw new BadRequestException('Parent file is not a directory');
    }

    return true;
  }

  public defaultMessage?(validationArguments?: ValidationArguments): string {
    const fieldValue = validationArguments?.value as string;

    return `Required parent file is not a directory or not found by ${fieldValue} id`;
  }
}
