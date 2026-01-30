import { UserRoles } from '@app/shared/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Full Name' })
  fullname!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'myemail@email.com' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Password123!' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRoles)
  @IsOptional()
  @ApiPropertyOptional({ example: UserRoles.ADMIN, default: UserRoles.USER })
  role?: UserRoles;

  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ example: true, default: false })
  hasAccess?: boolean;
}
