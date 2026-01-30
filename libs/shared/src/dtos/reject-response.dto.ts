import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectResponseDto {
  @ApiPropertyOptional({
    example: ['id should be a string', 'password is not strong enough'],
  })
  readonly message?: string | string[];

  @ApiProperty({ example: 'Some error message' })
  readonly error!: string;

  @ApiProperty({
    enum: HttpStatus,
    example: 'Status code 400/401/...',
  })
  readonly statusCode!: HttpStatus;
}
