import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SharedFileDto {
  @Expose()
  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  fileId!: string;

  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  userId!: string;
}
