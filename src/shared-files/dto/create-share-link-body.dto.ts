import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateShareLinkBodyDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db' })
  fileId!: string;

  @ApiProperty({
    example: 3600,
    description: 'TTL in seconds',
    required: false,
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Min(60)
  ttl?: number;
}
