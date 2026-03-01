import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSharedFileDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  fileId!: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  userId!: string;
}
