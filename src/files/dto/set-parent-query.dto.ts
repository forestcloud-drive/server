import { ValidateParentFile } from '@app/shared/validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';

export class SetParentQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @IsOptional()
  @Validate(ValidateParentFile)
  @ApiPropertyOptional({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  declare parentId?: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  declare link?: string;
}
