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

export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
