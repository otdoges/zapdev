"use client"

import { useEffect } from 'react'

export function ChunkErrorHandler() {
  useEffect(() => {
    // Handle chunk loading errors by refreshing the page
    const handleChunkError = (event: ErrorEvent) => {
      const isChunkError = event.message?.includes('Loading chunk') || 
                          event.message?.includes('ChunkLoadError') ||
                          event.filename?.includes('.js')

      if (isChunkError) {
        console.warn('Chunk loading error detected, refreshing page...', event)
        // Refresh the page to load the new chunks
        window.location.reload()
      }
    }

    // Handle unhandled promise rejections (common with dynamic imports)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const isChunkError = event.reason?.message?.includes('Loading chunk') ||
                          event.reason?.name === 'ChunkLoadError'

      if (isChunkError) {
        console.warn('Chunk loading promise rejection detected, refreshing page...', event.reason)
        // Prevent the error from being logged to console
        event.preventDefault()
        // Refresh the page to load the new chunks
        window.location.reload()
      }
    }

    // Add event listeners
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // This component doesn't render anything
} 