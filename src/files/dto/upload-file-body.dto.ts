import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class UploadFilesBodyDto {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    description: 'files',
  })
  files!: Express.Multer.File[];
}
