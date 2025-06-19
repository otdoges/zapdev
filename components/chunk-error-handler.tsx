"use client"

import { useEffect } from 'react'

export function ChunkErrorHandler() {
  useEffect(() => {
    // Simple chunk error handler that forces a page reload
    const handleChunkError = () => {
      console.warn('Chunk loading error detected, reloading page...')
      // Force a hard refresh to get latest chunks
      const currentUrl = window.location.href.split('?')[0]
      window.location.href = currentUrl + '?t=' + Date.now()
    }

    // Handle script/chunk loading errors
    const handleError = (event: Event) => {
      const target = event.target as any
      if (target && target.tagName === 'SCRIPT') {
        const src = target.src || ''
        if (src.includes('/_next/') || src.includes('.js')) {
          handleChunkError()
        }
      }
    }

    // Handle JavaScript errors
    const handleJSError = (event: ErrorEvent) => {
      const message = event.message || ''
      if (message.includes('Loading chunk') || message.includes('ChunkLoadError')) {
        handleChunkError()
      }
    }

    // Handle promise rejections from dynamic imports
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason?.message?.includes('Loading chunk') || reason?.name === 'ChunkLoadError') {
        event.preventDefault()
        handleChunkError()
      }
    }

    // Add event listeners
    window.addEventListener('error', handleError, true)
    window.addEventListener('error', handleJSError)
    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('error', handleJSError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
} 