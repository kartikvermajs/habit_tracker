"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays "fresh" for 5 min → back navigation never refetches
            staleTime: 5 * 60 * 1000,
            // Keep unused data in memory for 10 min so it's instant on re-mount
            gcTime: 10 * 60 * 1000,
            // Never trigger background fetches from focus / reconnect
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // Don't auto-retry on failure (avoids delays during nav)
            retry: 1,
          },
          mutations: {
            // Surface errors via toast, don't retry mutations
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
