import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetUserPasswordBodyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'newpass' })
  newPassword!: string;
}
