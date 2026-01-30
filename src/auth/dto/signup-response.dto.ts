import { UserDto } from '@app/shared/dtos';
import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ example: 'jwt token' })
  readonly auth_token!: string;

  @ApiProperty({ type: UserDto })
  readonly user!: UserDto;
}
