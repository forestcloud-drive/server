import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveFileBodyDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((object: MoveFileBodyDto) => object.targetDir !== 'root')
  @IsUUID()
  @ApiProperty({
    example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db',
    description: 'A valid UUID or the keyword "root"',
    oneOf: [
      { type: 'string', format: 'uuid' },
      { type: 'string', example: 'root' },
    ],
  })
  declare targetDir: string;
}
