import { IsEmail, IsString, MinLength } from 'class-validator'

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
  @IsString()
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(2)
  username!: string

  @IsString()
  @MinLength(8)
  password!: string
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string
}
