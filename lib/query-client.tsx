'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// Create a client with proper caching and retry configuration
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: data stays in cache for 10 minutes after becoming stale
        gcTime: 10 * 60 * 1000,
        // Retry failed requests with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
          if (error?.status && error.status >= 400 && error.status < 500 && 
              error.status !== 408 && error.status !== 429) {
            return false
          }
          // Retry up to 3 times
          return failureCount < 3
        },
        // Time between retries with exponential backoff
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus to keep data fresh
        refetchOnWindowFocus: 'always',
        // Network status
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations on network error
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      }
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: useState is used to avoid re-creating on every render
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}

// Export a singleton query client for server components
export const queryClient = getQueryClient()