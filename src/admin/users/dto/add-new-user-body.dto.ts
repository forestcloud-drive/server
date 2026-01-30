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

export class AddNewUserBodyDto {
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
  @ApiProperty({ example: UserRoles.ADMIN })
  role!: UserRoles;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: false, default: true })
  hasAccess?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true, default: true })
  mustChangePassword?: boolean;
}
