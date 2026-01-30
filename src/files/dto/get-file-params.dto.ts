import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetFileParamsDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  declare fileId: string;
}
