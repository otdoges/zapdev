"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import loader from '@monaco-editor/loader'

// Monaco Editor types
interface MonacoEditorProps {
  value?: string
  defaultValue?: string
  language?: string
  defaultLanguage?: string
  theme?: string
  height?: string | number
  width?: string | number
  options?: any
  onChange?: (value: string | undefined) => void
  onMount?: (editor: any, monaco: any) => void
}

// Loading component
const LoadingSpinner = () => (
  <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e]">
    <div className="animate-pulse flex space-x-2">
      <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.2s]"></div>
      <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.4s]"></div>
    </div>
  </div>
)

// Error fallback component
const ErrorFallback = ({ error }: { error?: string }) => (
  <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-red-400">
    <div className="text-center">
      <div className="text-lg mb-2">⚠️ Editor Error</div>
      <div className="text-sm opacity-75">
        {error || 'Failed to initialize code editor'}
      </div>
    </div>
  </div>
)

// Dynamically import Monaco Editor with error boundary
const MonacoEditorComponent = dynamic(
  async () => {
    try {
      // Configure Monaco before importing
      if (typeof window !== 'undefined') {
        loader.config({
          paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
          }
        })
      }
      
      const { default: Editor } = await import('@monaco-editor/react')
      
      return ({ onError, ...props }: MonacoEditorProps & { onError?: (error: any) => void }) => {
        const [hasError, setHasError] = useState(false)
        const [errorMessage, setErrorMessage] = useState<string>()
        
        const handleError = (error: any) => {
          console.error('Monaco Editor error:', error)
          setHasError(true)
          setErrorMessage(error?.message || 'Unknown error')
          onError?.(error)
        }

        if (hasError) {
          return <ErrorFallback error={errorMessage} />
        }

        return (
          <Editor
            {...props}
            beforeMount={(monaco) => {
              try {
                // Configure Monaco themes and languages
                monaco.editor.defineTheme('vs-dark-custom', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [],
                  colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4',
                    'editorLineNumber.foreground': '#858585',
                    'editor.selectionBackground': '#264f78',
                    'editor.inactiveSelectionBackground': '#3a3d41',
                  }
                })
              } catch (error) {
                handleError(error)
              }
            }}
            onMount={(editor, monaco) => {
              try {
                props.onMount?.(editor, monaco)
              } catch (error) {
                handleError(error)
              }
            }}
            loading={<LoadingSpinner />}
          />
        )
      }
    } catch (error) {
      console.error('Failed to load Monaco Editor:', error)
      return () => <ErrorFallback error="Failed to load editor" />
    }
  },
  {
    ssr: false,
    loading: LoadingSpinner
  }
)

// Main wrapper component
export function MonacoEditor(props: MonacoEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorFallback error={error} />
  }

  return (
    <MonacoEditorComponent
      {...props}
      theme={props.theme || 'vs-dark-custom'}
      onError={setError}
    />
  )
}

export default MonacoEditor 