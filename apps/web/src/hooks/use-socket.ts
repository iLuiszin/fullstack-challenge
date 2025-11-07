import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket, disconnectSocket, setQueryClient } from '@/lib/socket'
import { useAuthStore } from '@/stores/auth-store'

export const useSocket = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const queryClient = useQueryClient()

  useEffect(() => {
    setQueryClient(queryClient)
  }, [queryClient])

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated])
}
