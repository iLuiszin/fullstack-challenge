import { IsEmail, IsString, MinLength } from 'class-validator'

export interface User {
  id: string
  email: string
  username: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser extends User {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  id: string
  email: string
  role: string
}

export interface LoginResponse {
  accessToken: string
}

export interface ValidateTokenResponse {
  valid: boolean
  userId: string | null
  role: string | null
}

export class RegisterDto {
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

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string
}
