import { UserPayloadDto } from '@app/shared/dtos';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SigninResponseDto {
  @ApiProperty({ example: 'jwt token' })
  readonly auth_token!: string;

  @ApiProperty({ type: UserPayloadDto })
  readonly user!: UserPayloadDto;

  @ApiPropertyOptional({ example: 'Logged in successfully' })
  message?: string;

  @ApiPropertyOptional({ example: false })
  temporaryPasswordUsed?: boolean;
}
