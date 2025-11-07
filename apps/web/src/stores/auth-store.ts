import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QueryClient } from '@tanstack/react-query'
import type { UserResponse } from '@repo/types'

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: UserResponse
  ) => void
  logout: (queryClient?: QueryClient) => void
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
          isAuthenticated: true,
        }),
      logout: (queryClient) => {
        queryClient?.invalidateQueries({ queryKey: ['notifications'] })
        queryClient?.removeQueries({ queryKey: ['notifications'] })

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
      updateTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
