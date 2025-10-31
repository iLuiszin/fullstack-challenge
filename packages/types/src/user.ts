import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export interface UserResponse {
  id: string
  email: string
  username: string
  createdAt: Date
  updatedAt: Date
}

export interface JwtPayload {
  id: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserResponse
}

export interface ValidateTokenResponse {
  valid: boolean
  userId: string | null
}

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
