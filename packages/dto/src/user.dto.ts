import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsString()
  @IsEmail()
  email!: string

  @ApiProperty({ description: 'Username', minLength: 2, example: 'johndoe' })
  @IsString()
  @MinLength(2)
  username!: string

  @ApiProperty({ description: 'User password (minimum 8 characters)', minLength: 8, example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ description: 'User password', minLength: 8, example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string
}
